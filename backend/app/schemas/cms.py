from datetime import datetime

from pydantic import BaseModel, Field


class CMSSettingUpdateRequest(BaseModel):
    category: str
    label: str
    value: dict = Field(default_factory=dict)
    value_type: str = "json"
    is_public: bool = True


class LegalDocumentUpdateRequest(BaseModel):
    title: str
    content_markdown: str
    version: str = "1.0"
    is_active: bool = True


class CMSBundleResponse(BaseModel):
    settings: dict
    legal: dict
    fetched_at: datetime
