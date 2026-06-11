from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UniversityProgramResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    major_name: str
    major_name_kh: str | None
    faculty: str | None
    duration_years: str | None
    degree_level: str
    language: str | None
    program_url: str | None


class UniversityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    location: str
    type: str
    website: str | None
    tuition_usd_year: float | None
    scholarship_available: bool
    description: str | None
    programs: list[UniversityProgramResponse] = []


class UniversityCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    location: str = Field(min_length=1, max_length=100)
    type: str = Field(min_length=1, max_length=20)
    website: str | None = None
    tuition_usd_year: float | None = None
    scholarship_available: bool = False
    description: str | None = None


class UniversityUpdateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    location: str = Field(min_length=1, max_length=100)
    type: str = Field(min_length=1, max_length=20)
    website: str | None = None
    tuition_usd_year: float | None = None
    scholarship_available: bool = False
    description: str | None = None
    is_active: bool = True


class UniversityProgramCreateRequest(BaseModel):
    major_name: str = Field(min_length=1, max_length=120)
    major_name_kh: str | None = None
    faculty: str | None = None
    duration_years: str | None = None
    degree_level: str = "Bachelor"
    language: str | None = None
    program_url: str | None = None


class UniversityProgramUpdateRequest(BaseModel):
    major_name: str = Field(min_length=1, max_length=120)
    major_name_kh: str | None = None
    faculty: str | None = None
    duration_years: str | None = None
    degree_level: str = "Bachelor"
    language: str | None = None
    program_url: str | None = None
    is_active: bool = True
