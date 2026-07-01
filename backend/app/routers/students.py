from __future__ import annotations

from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.data.cambodia_universities import CAREER_PATHS, MAJOR_KHMER, UNIVERSITIES
from app.database import get_db
from app.models.grade import Grade
from app.models.interest import Interest
from app.models.ml_prediction import MLPrediction
from app.models.personality import PersonalityScore
from app.models.recommendation import Recommendation
from app.models.student import Student
from app.models.university import University
from app.schemas.student import StudentProfileResponse, StudentSubmitRequest, StudentSubmitResponse
from app.services.experience_service import flatten_experience_insights, get_approved_experience_insights
from app.services.gemini_service import gemini_service
from app.services.predictor_singleton import predictor

router = APIRouter(prefix="/students", tags=["students"])


def _score_and_letter(value: float | str) -> tuple[float, str | None]:
    mapping = {"A": 95, "B": 85, "C": 75, "D": 65, "E": 55, "F": 45}
    if isinstance(value, str):
        letter = value.upper()
        return float(mapping.get(letter, 0)), letter
    return float(value), None


def _format_universities(universities: list[dict]) -> list[dict]:
    return [
        {
            "name": item["name"],
            "type": item["type"],
            "tuition": f"${item['tuition_usd_year']}/year",
            "rank": "Scholarship available" if item.get("scholarship_available") else "University option",
            "location": item["location"],
            "website": item.get("website"),
        }
        for item in universities
    ]


def _budget_cap(budget_range: str | None) -> float | None:
    return {
        "low": 500,
        "public": 500,
        "scholarship": 500,
        "medium": 1500,
        "high": 3000,
        "private": 3000,
        "any": None,
        None: None,
    }.get(budget_range, None)


async def _fetch_matching_universities(db: AsyncSession, major: str, province: str | None, budget_range: str | None) -> list[dict]:
    query = select(University).options(selectinload(University.programs)).where(University.is_active.is_(True))
    rows = (await db.scalars(query)).all()
    budget_cap = _budget_cap(budget_range)
    normalized_province = (province or "").replace("_", " ").lower()
    matched = []

    for row in rows:
        if budget_cap is not None and row.tuition_usd_year is not None and row.tuition_usd_year > budget_cap:
            continue
        if normalized_province and normalized_province not in {"other", ""}:
            row_location = (row.location or "").replace("_", " ").lower()
            if normalized_province not in row_location:
                continue
        if not any(program.major_name == major for program in row.programs):
            continue
        matched.append(
            {
                "name": row.name,
                "type": row.type,
                "tuition_usd_year": row.tuition_usd_year,
                "scholarship_available": row.scholarship_available,
                "location": row.location,
                "website": row.website,
            }
        )

    return matched or UNIVERSITIES.get(major, [])


def _build_frontend_results(prediction_result: dict, university_map: dict[str, list[dict]]) -> list[dict]:
    results = []
    for item in prediction_result["all_predictions"][:4]:
        major = item["major"]
        results.append(
            {
                "major": major,
                "major_kh": MAJOR_KHMER.get(major, major),
                "match": round(item["confidence"] * 100, 2),
                "why_en": item.get("explanation_en", f"{major} matches your academic profile, interests, and current preference pattern."),
                "why_kh": item.get("explanation_kh", f"ជំនាញ {MAJOR_KHMER.get(major, major)} សមស្របជាមួយលទ្ធផលសិក្សា ចំណាប់អារម្មណ៍ និងចំណូលចិត្តរបស់អ្នក។"),
                "universities": _format_universities(university_map.get(major, UNIVERSITIES.get(major, []))),
            }
        )
    return results


@router.post("/submit", response_model=StudentSubmitResponse)
async def submit_student(payload: StudentSubmitRequest, db: AsyncSession = Depends(get_db)):
    try:
        student = Student(
            name=payload.name,
            email=payload.email,
            phone=payload.phone,
            grade_level=payload.grade_level,
            province=payload.province,
            budget_range=payload.budget_range,
            session_id=uuid4(),
        )
        db.add(student)
        await db.flush()

        for subject, raw_value in payload.grades.items():
            score, letter = _score_and_letter(raw_value)
            db.add(Grade(student_id=student.id, subject=subject, score=score, grade_letter=letter))

        for item in payload.interests:
            db.add(Interest(student_id=student.id, interest=item))

        db.add(
            PersonalityScore(
                student_id=student.id,
                analytical_score=payload.personality.analytical_score,
                creative_score=payload.personality.creative_score,
                people_oriented_score=payload.personality.people_oriented_score,
                detail_oriented_score=payload.personality.detail_oriented_score,
            )
        )

        student_features = {
            "grades": payload.grades,
            "interests": payload.interests,
            "budget_range": payload.budget_range,
            "province": payload.province,
            "track": payload.track,
            "personality": payload.personality.model_dump(),
        }
        prediction_result = predictor.predict(student_features)

        prediction = MLPrediction(
            student_id=student.id,
            top_major=prediction_result["top_major"],
            top_confidence=prediction_result["top_score"],
            all_predictions=prediction_result["all_predictions"],
            model_used=prediction_result["model_used"],
            model_accuracy=prediction_result["model_accuracy"],
            training_samples=prediction_result["training_samples"],
            raw_features=prediction_result["raw_features"],
        )
        db.add(prediction)
        await db.flush()

        top_major = prediction_result["top_major"]
        alt_majors = [item["major"] for item in prediction_result["all_predictions"][1:]]
        majors = [top_major] + alt_majors
        experience_insights = await get_approved_experience_insights(db, majors)
        flattened_insights = flatten_experience_insights(experience_insights)
        university_map = {
            major: await _fetch_matching_universities(db, major, payload.province, payload.budget_range)
            for major in majors
        }
        frontend_results = _build_frontend_results(prediction_result, university_map)
        recommended_majors = []
        recommended_universities = []
        for idx, major in enumerate(majors):
            universities = university_map.get(major, UNIVERSITIES.get(major, []))
            paths = CAREER_PATHS.get(major, [])
            recommended_majors.append(
                {
                    "major": major,
                    "major_kh": MAJOR_KHMER.get(major, major),
                    "reason": f"Strong match with your profile and selected interests.",
                    "match_score": round(prediction_result["all_predictions"][idx]["confidence"] * 100, 2),
                    "universities": _format_universities(universities),
                    "why_en": prediction_result["all_predictions"][idx].get("explanation_en", f"{major} matches your academic profile, interests, and current preference pattern."),
                    "why_kh": prediction_result["all_predictions"][idx].get("explanation_kh", f"ជំនាញ {MAJOR_KHMER.get(major, major)} សមស្របជាមួយលទ្ធផលសិក្សា ចំណាប់អារម្មណ៍ និងចំណូលចិត្តរបស់អ្នក។"),
                    "experience_insights": experience_insights.get(major, []),
                }
            )
            recommended_universities.extend(_format_universities(universities))

        summary = gemini_service.recommendation_summary(
            student={
                "name": payload.name,
                "province": payload.province,
                "budget_range": payload.budget_range,
                "top_grades": str(payload.grades),
                "interests": payload.interests,
            },
            prediction=prediction_result,
            universities=university_map.get(top_major, UNIVERSITIES.get(top_major, [])),
            career_paths=CAREER_PATHS.get(top_major, []),
            experience_insights=flattened_insights,
        )

        recommendation = Recommendation(
            student_id=student.id,
            ml_prediction_id=prediction.id,
            recommended_majors=recommended_majors,
            recommended_universities=recommended_universities,
            career_paths=CAREER_PATHS.get(top_major, []),
            gemini_summary=summary,
        )
        db.add(recommendation)
        await db.commit()

        return StudentSubmitResponse(
            student_id=student.id,
            session_id=student.session_id,
            ml_prediction=prediction_result,
            recommendation={
                "recommended_majors": recommended_majors,
                "recommended_universities": recommended_universities,
                "career_paths": CAREER_PATHS.get(top_major, []),
                "experience_insights": experience_insights,
            },
            gemini_summary=summary,
            results=frontend_results,
        )
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail={"error": "Failed to submit student", "message": str(exc)})


@router.get("/{student_id}", response_model=StudentProfileResponse)
async def get_student(student_id: UUID, db: AsyncSession = Depends(get_db)):
    try:
        student = await db.scalar(select(Student).where(Student.id == student_id))
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        grades = (await db.scalars(select(Grade).where(Grade.student_id == student.id))).all()
        interests = (await db.scalars(select(Interest).where(Interest.student_id == student.id))).all()
        personality = await db.scalar(select(PersonalityScore).where(PersonalityScore.student_id == student.id))

        return StudentProfileResponse(
            id=student.id,
            name=student.name,
            email=student.email,
            phone=student.phone,
            grade_level=student.grade_level,
            province=student.province,
            budget_range=student.budget_range,
            session_id=student.session_id,
            grades=[{"subject": g.subject, "score": g.score, "grade_letter": g.grade_letter} for g in grades],
            interests=[i.interest for i in interests],
            personality={
                "analytical_score": personality.analytical_score if personality else 3.0,
                "creative_score": personality.creative_score if personality else 3.0,
                "people_oriented_score": personality.people_oriented_score if personality else 3.0,
                "detail_oriented_score": personality.detail_oriented_score if personality else 3.0,
            },
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail={"error": "Failed to fetch student", "message": str(exc)})
