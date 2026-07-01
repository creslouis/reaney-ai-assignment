from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = Field(alias="DATABASE_URL")

    gemini_api_key: str = Field(default="")

    admin_api_key: str = Field(default="", alias="ADMIN_API_KEY")
    survey_webhook_token: str = Field(default="", alias="SURVEY_WEBHOOK_TOKEN")

    frontend_url: str = Field(default="http://localhost:5173", alias="FRONTEND_URL")
    environment: str = Field(default="development", alias="ENVIRONMENT")

    ml_retrain_threshold: int = Field(default=50, alias="ML_RETRAIN_THRESHOLD")
    ml_retrain_interval_days: int = Field(default=7, alias="ML_RETRAIN_INTERVAL_DAYS")

    google_sheets_api_key: str = Field(default="", alias="GOOGLE_SHEETS_API_KEY")
    jwt_secret_key: str = Field(default="change_me", alias="JWT_SECRET_KEY")
    google_client_id: str = Field(default="", alias="GOOGLE_CLIENT_ID")
    google_allowed_admin_emails: str = Field(default="", alias="GOOGLE_ALLOWED_ADMIN_EMAILS")
    jwt_refresh_secret_key: str = Field(default="change_me_too", alias="JWT_REFRESH_SECRET_KEY")


@lru_cache
def get_settings() -> Settings:
    return Settings()
