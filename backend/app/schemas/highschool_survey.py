from typing import List, Optional
from pydantic import BaseModel, Field

class PersonalityScore(BaseModel):
    analytical_score: float = 3.0
    creative_score: float = 3.0
    people_oriented_score: float = 3.0
    detail_oriented_score: float = 3.0

class HighschoolSurveyRequest(BaseModel):
    study_track: str = Field(..., example="Science Track")
    intended_major: str = Field(..., example="Computer Science & IT")
    province: Optional[str] = None
    budget_range: Optional[str] = None
    
    math_score: Optional[float] = None
    khmer_score: Optional[float] = None
    english_score: Optional[float] = None
    science_score: Optional[float] = None
    biology_score: Optional[float] = None
    history_score: Optional[float] = None
    geography_score: Optional[float] = None
    physics_score: Optional[float] = None
    chemistry_score: Optional[float] = None

    interests: List[str] = []
    personality: PersonalityScore = PersonalityScore()

class HighschoolSurveyResponse(BaseModel):
    success: bool
    prediction: dict
    message: str
