from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.middleware.auth import AdminAuth
from app.models.university import University
from app.models.university_program import UniversityProgram
from app.schemas.university import (
    UniversityCreateRequest,
    UniversityProgramCreateRequest,
    UniversityProgramUpdateRequest,
    UniversityResponse,
    UniversityUpdateRequest,
)
from app.services.audit_service import log_audit_event
from app.services.auth_service import decode_access_token
from app.services.university_service import seed_university_data

router = APIRouter(prefix="/universities", tags=["universities"])


def _admin_user_id_from_auth(authorization: str) -> str | None:
    if not authorization.startswith("Bearer "):
        return None
    try:
        return decode_access_token(authorization.replace("Bearer ", "", 1).strip()).get("sub")
    except Exception:
        return None


@router.get("", response_model=list[UniversityResponse])
async def list_universities(db: AsyncSession = Depends(get_db)):
    rows = (
        await db.scalars(select(University).options(selectinload(University.programs)).where(University.is_active.is_(True)))
    ).all()
    return rows


@router.get("/search", response_model=list[UniversityResponse])
async def search_universities(
    major: str | None = Query(default=None),
    location: str | None = Query(default=None),
    budget: float | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    query = select(University).options(selectinload(University.programs)).where(University.is_active.is_(True))
    if location:
        query = query.where(University.location.ilike(f"%{location}%"))
    if budget is not None:
        query = query.where((University.tuition_usd_year.is_(None)) | (University.tuition_usd_year <= budget))
    rows = (await db.scalars(query)).all()
    if major:
        rows = [row for row in rows if any(program.major_name == major for program in row.programs)]
    return rows


@router.post("/import", dependencies=[AdminAuth])
async def import_university_data(db: AsyncSession = Depends(get_db)):
    try:
        return await seed_university_data(db)
    except Exception as exc:
        raise HTTPException(status_code=400, detail={"error": "University import failed", "message": str(exc)})


@router.post("/refresh", dependencies=[AdminAuth])
async def refresh_university_data(db: AsyncSession = Depends(get_db)):
    try:
        return await seed_university_data(db)
    except Exception as exc:
        raise HTTPException(status_code=400, detail={"error": "University refresh failed", "message": str(exc)})


@router.post("", dependencies=[AdminAuth], response_model=UniversityResponse)
async def create_university(
    payload: UniversityCreateRequest,
    db: AsyncSession = Depends(get_db),
    authorization: str = Header(default=""),
):
    try:
        university = University(**payload.model_dump(), is_active=True)
        db.add(university)
        await db.flush()
        await log_audit_event(
            db,
            admin_user_id=_admin_user_id_from_auth(authorization),
            action="university.create",
            target_type="university",
            target_id=str(university.id),
            details={"name": university.name},
        )
        await db.commit()
        await db.refresh(university)
        return university
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail={"error": "University create failed", "message": str(exc)})


@router.put("/{university_id}", dependencies=[AdminAuth], response_model=UniversityResponse)
async def update_university(
    university_id: UUID,
    payload: UniversityUpdateRequest,
    db: AsyncSession = Depends(get_db),
    authorization: str = Header(default=""),
):
    university = await db.scalar(select(University).options(selectinload(University.programs)).where(University.id == university_id))
    if not university:
        raise HTTPException(status_code=404, detail="University not found")
    try:
        for key, value in payload.model_dump().items():
            setattr(university, key, value)
        await log_audit_event(
            db,
            admin_user_id=_admin_user_id_from_auth(authorization),
            action="university.update",
            target_type="university",
            target_id=str(university.id),
            details={"name": university.name},
        )
        await db.commit()
        await db.refresh(university)
        return university
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail={"error": "University update failed", "message": str(exc)})


@router.post("/{university_id}/programs", dependencies=[AdminAuth])
async def create_program(
    university_id: UUID,
    payload: UniversityProgramCreateRequest,
    db: AsyncSession = Depends(get_db),
    authorization: str = Header(default=""),
):
    university = await db.scalar(select(University).where(University.id == university_id))
    if not university:
        raise HTTPException(status_code=404, detail="University not found")
    try:
        program = UniversityProgram(university_id=university.id, **payload.model_dump(), is_active=True)
        db.add(program)
        await db.flush()
        await log_audit_event(
            db,
            admin_user_id=_admin_user_id_from_auth(authorization),
            action="program.create",
            target_type="university_program",
            target_id=str(program.id),
            details={"major_name": program.major_name, "university_id": str(university.id)},
        )
        await db.commit()
        return {"success": True, "id": str(program.id)}
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail={"error": "Program create failed", "message": str(exc)})


@router.put("/programs/{program_id}", dependencies=[AdminAuth])
async def update_program(
    program_id: UUID,
    payload: UniversityProgramUpdateRequest,
    db: AsyncSession = Depends(get_db),
    authorization: str = Header(default=""),
):
    program = await db.scalar(select(UniversityProgram).where(UniversityProgram.id == program_id))
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    try:
        for key, value in payload.model_dump().items():
            setattr(program, key, value)
        await log_audit_event(
            db,
            admin_user_id=_admin_user_id_from_auth(authorization),
            action="program.update",
            target_type="university_program",
            target_id=str(program.id),
            details={"major_name": program.major_name},
        )
        await db.commit()
        return {"success": True}
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail={"error": "Program update failed", "message": str(exc)})
