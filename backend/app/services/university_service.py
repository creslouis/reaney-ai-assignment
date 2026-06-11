from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.cambodia_universities import CAREER_PATHS, MAJOR_KHMER, UNIVERSITIES
from app.models.career_market_data import CareerMarketData
from app.models.scholarship import Scholarship
from app.models.university import University
from app.models.university_program import UniversityProgram


def _description_for_university(item: dict) -> str:
    tuition = item.get("tuition_usd_year")
    tuition_text = f"Approx. ${tuition}/year" if tuition is not None else "Tuition varies"
    return f"{item['type'].title()} university in {item['location']}. {tuition_text}."


async def seed_university_data(db: AsyncSession) -> dict[str, int]:
    existing = await db.scalar(select(University.id).limit(1))
    if existing:
        return {"universities": 0, "programs": 0, "careers": 0, "scholarships": 0}

    universities_added = 0
    programs_added = 0
    careers_added = 0
    scholarships_added = 0
    university_map: dict[str, University] = {}

    for major, university_items in UNIVERSITIES.items():
        for item in university_items:
            if item["name"] not in university_map:
                university = University(
                    name=item["name"],
                    location=item["location"],
                    type=item["type"],
                    website=item.get("website"),
                    tuition_usd_year=item.get("tuition_usd_year"),
                    scholarship_available=item.get("scholarship_available", False),
                    description=_description_for_university(item),
                )
                db.add(university)
                await db.flush()
                university_map[item["name"]] = university
                universities_added += 1

            university = university_map[item["name"]]
            db.add(
                UniversityProgram(
                    university_id=university.id,
                    major_name=major,
                    major_name_kh=MAJOR_KHMER.get(major),
                    faculty=f"Faculty of {major}",
                    duration_years="4",
                    degree_level="Bachelor",
                    language="English/Khmer",
                    program_url=item.get("website"),
                )
            )
            programs_added += 1

            if item.get("scholarship_available"):
                db.add(
                    Scholarship(
                        university_id=university.id,
                        name=f"{university.name} Scholarship",
                        provider=university.name,
                        eligibility="Merit-based and need-based criteria may apply.",
                        coverage="Partial tuition support",
                        website=item.get("website"),
                    )
                )
                scholarships_added += 1

    for major, careers in CAREER_PATHS.items():
        for career in careers:
            db.add(
                CareerMarketData(
                    major_name=major,
                    career_name=career["career"],
                    avg_salary_usd_month=career.get("avg_salary_usd_month"),
                    demand_level=career.get("demand"),
                    notes=f"Curated Cambodia market data for {career['career']}",
                )
            )
            careers_added += 1

    await db.commit()
    return {
        "universities": universities_added,
        "programs": programs_added,
        "careers": careers_added,
        "scholarships": scholarships_added,
    }
