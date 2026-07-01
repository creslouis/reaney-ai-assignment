from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import AsyncSessionLocal, create_tables
from app.models.cms_setting import CMSSetting
from app.models.university import University
from app.routers import auth, chat, cms, contact, experience, ml, recommendations, students, survey, universities, highschool_survey
from app.services.cms_service import seed_cms_defaults
from app.services.predictor_singleton import predictor
from app.services.university_service import seed_university_data
from ml.training.seed_data import generate_seed_data
from ml.training.train_model import should_retrain, train_and_save

settings = get_settings()

app = FastAPI(title="Cambodian Student Career Finder API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(students.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(cms.router, prefix="/api/v1")
app.include_router(ml.router, prefix="/api/v1")
app.include_router(recommendations.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(contact.router, prefix="/api/v1")
app.include_router(survey.router, prefix="/api/v1")
app.include_router(highschool_survey.router, prefix="/api/v1")
app.include_router(universities.router, prefix="/api/v1")
app.include_router(experience.router, prefix="/api/v1")



@app.get("/")
async def root():
    return {"service": "career-finder-api", "status": "ok"}


async def check_and_retrain_if_needed() -> None:
    if should_retrain():
        train_and_save(data_source="survey", triggered_by="startup")
        predictor.load_models()


async def seed_university_data_if_needed() -> None:
    async with AsyncSessionLocal() as session:
        existing = await session.scalar(select(University.id).limit(1))
        if not existing:
            await seed_university_data(session)


async def seed_cms_if_needed() -> None:
    async with AsyncSessionLocal() as session:
        await seed_cms_defaults(session)


@app.on_event("startup")
async def startup() -> None:
    await create_tables()

    predictor.load_models()

    if not os.path.exists("ml/data/seed_dataset.csv"):
        generate_seed_data(n_samples=300)

    if not os.path.exists("ml/models/major_classifier.pkl"):
        train_and_save(data_source="seed", triggered_by="startup")
        predictor.load_models()

    await seed_university_data_if_needed()
    await seed_cms_if_needed()
    await check_and_retrain_if_needed()


Path("ml/models").mkdir(parents=True, exist_ok=True)
Path("ml/data").mkdir(parents=True, exist_ok=True)
