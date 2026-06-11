from pydantic import BaseModel


class RecommendationResponse(BaseModel):
    student_id: str
    recommended_majors: list[dict]
    recommended_universities: list[dict]
    career_paths: list[dict]
    gemini_summary: str
