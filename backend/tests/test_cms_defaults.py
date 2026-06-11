import os

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://user:password@localhost:5432/dbname")

from app.services.cms_service import DEFAULT_LEGAL, DEFAULT_SETTINGS  # noqa: E402


def test_cms_defaults_include_branding_theme_and_content():
    keys = {item["key"] for item in DEFAULT_SETTINGS}
    assert "branding.app" in keys
    assert "theme.colors" in keys
    assert "content.home" in keys
    assert "content.experience" in keys


def test_legal_defaults_include_terms_and_privacy():
    slugs = {item["slug"] for item in DEFAULT_LEGAL}
    assert "terms" in slugs
    assert "privacy" in slugs
