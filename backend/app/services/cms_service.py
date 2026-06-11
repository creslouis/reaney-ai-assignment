from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cms_setting import CMSSetting
from app.models.legal_document import LegalDocument


DEFAULT_SETTINGS = [
    {
        "category": "branding",
        "key": "branding.app",
        "label": "App Branding",
        "value": {
            "app_name_en": "ReanEy",
            "app_name_km": "រៀនអី",
            "brand_icon": "🎓",
            "tagline_en": "Find your future major with confidence",
            "tagline_km": "ស្វែងរកជំនាញអនាគតរបស់អ្នកដោយទំនុកចិត្ត",
        },
    },
    {
        "category": "theme",
        "key": "theme.colors",
        "label": "Theme Colors",
        "value": {
            "bg": "#f7f5f0",
            "white": "#ffffff",
            "surface": "#fdfcfa",
            "border": "#e8e3db",
            "border2": "#d4cdc2",
            "ink": "#1a1714",
            "ink2": "#4a4540",
            "muted": "#9a9088",
            "primary": "#c85a2a",
            "primary_light": "#f5ede8",
            "primary_dark": "#a04420",
            "gold": "#d4a017",
            "gold_light": "#fdf6e3",
            "blue": "#2a6cb8",
            "blue_light": "#e8f0fb",
            "green": "#2a8a5a",
            "green_light": "#e8f5ee",
        },
    },
    {
        "category": "navigation",
        "key": "navigation.labels",
        "label": "Navigation Labels",
        "value": {
            "student_en": "Students",
            "student_km": "សិស្ស",
            "experience_en": "Experience",
            "experience_km": "បទពិសោធន៍",
            "admin_en": "Admin",
            "admin_km": "គ្រប់គ្រង",
        },
    },
    {
        "category": "content",
        "key": "content.home",
        "label": "Home Content",
        "value": {
            "strand_title_en": "What's your BAC II strand?",
            "strand_title_km": "តើអ្នកនៅក្នុងផ្នែកអ្វីនៃ BAC II?",
            "strand_sub_en": "Select the stream you studied in Grade 12",
            "strand_sub_km": "ជ្រើសរើសផ្នែកដែលអ្នករៀននៅថ្នាក់ទី១២",
        },
    },
    {
        "category": "content",
        "key": "content.experience",
        "label": "Experience Page Content",
        "value": {
            "title_en": "Share Your Experience",
            "title_km": "ចែករំលែកបទពិសោធន៍របស់អ្នក",
            "sub_en": "Help future students by sharing what you learned about your major, university, and work path.",
            "sub_km": "ជួយសិស្សជំនាន់ក្រោយដោយប្រាប់អំពីជំនាញ សាកលវិទ្យាល័យ និងអាជីពរបស់អ្នក។",
        },
    },
]

DEFAULT_LEGAL = [
    {
        "slug": "terms",
        "title": "Terms and Conditions",
        "content_markdown": "# Terms and Conditions\n\nBy using ReanEy, you agree to use the platform responsibly and provide truthful information.",
    },
    {
        "slug": "privacy",
        "title": "Privacy Policy",
        "content_markdown": "# Privacy Policy\n\nWe store submitted data to improve recommendations and administer the platform securely.",
    },
]


async def seed_cms_defaults(db: AsyncSession) -> None:
    existing_settings = {item.key: item for item in (await db.scalars(select(CMSSetting))).all()}
    for item in DEFAULT_SETTINGS:
        if item["key"] not in existing_settings:
            db.add(CMSSetting(**item, value_type="json", is_public=True))

    existing_legal = {item.slug: item for item in (await db.scalars(select(LegalDocument))).all()}
    for item in DEFAULT_LEGAL:
        if item["slug"] not in existing_legal:
            db.add(LegalDocument(**item, version="1.0", is_active=True))
    await db.commit()


async def get_public_cms_bundle(db: AsyncSession) -> dict:
    settings = (await db.scalars(select(CMSSetting).where(CMSSetting.is_public.is_(True)))).all()
    legal = (await db.scalars(select(LegalDocument).where(LegalDocument.is_active.is_(True)))).all()
    return {
        "settings": {item.key: item.value for item in settings},
        "legal": {item.slug: {"title": item.title, "content_markdown": item.content_markdown, "version": item.version} for item in legal},
        "fetched_at": datetime.now(timezone.utc),
    }
