from __future__ import annotations

from typing import Any

import google.generativeai as genai

from app.config import get_settings

RECOMMENDATION_PROMPT = """
You are an expert, supportive career advisor for Cambodian high school students.
Generate a very brief, concise, and helpful career recommendation explanation in exactly 1-2 short paragraphs.
Write in simple English that a Grade 12 student can understand.

CRITICAL INSTRUCTIONS:
- Keep the response extremely short and easy to read. Maximum 4-5 sentences total.
- Use bullet points if necessary to save space.
- Always clarify that your recommendations are NOT absolute commands, but rather suggestions based on the student's survey results and educational research.
- Act as a bridge between the student and their future by offering guidance without being controlling.

Student Profile:
- Name: {name}
- Province: {province}
- Budget: {budget}
- Top Grades: {top_grades}
- Interests: {interests}

ML Model Predicted:
- Top Major: {top_major} (confidence: {confidence}%)
- Alternative Majors: {alt_majors}

Recommended Universities in Cambodia:
{universities}

Career Paths for {top_major} in Cambodia:
{career_paths}

Approved Real-World Experience Insights:
{experience_insights}
"""

CHATBOT_SYSTEM_PROMPT = """
You are a friendly, knowledgeable career advisor named "អ្នកណែនាំ" (Advisor) for Cambodian students.
You speak both Khmer and English - always respond in the same language the student uses.

CRITICAL INSTRUCTIONS:
- YOUR RESPONSES MUST BE VERY SHORT AND CONCISE. Maximum 2-3 short sentences per reply.
- Never write long walls of text. Get straight to the point.
- Act as a supportive bridge between the student and AI.
- Clearly state that your suggestions are not absolute rules, but objective recommendations based on their survey and research.
- Do not be controlling. Validate the student's feelings and guide them gently.

This student's profile:
- Name: {name}, Province: {province}, Budget: {budget}
- Grades: {grades_summary}
- Interests: {interests}
- ML Recommended Major: {top_major} ({confidence}% confidence)
- Alternative Majors: {alt_majors}
- Recommended Universities: {universities}
- Career Paths: {career_paths}
- Gemini Summary shown to them: {gemini_summary}
- Approved experience insights: {experience_insights}
"""


class GeminiService:
    def __init__(self) -> None:
        settings = get_settings()
        self.available = bool(settings.gemini_api_key)
        self.model_name = "gemini-2.5-flash"
        if self.available:
            genai.configure(api_key=settings.gemini_api_key)
            self.model = genai.GenerativeModel(self.model_name)
        else:
            self.model = None

    def _generate(self, prompt: str, fallback: str) -> str:
        if not self.available or self.model is None:
            return "[API ERROR] Gemini API Key is missing. self.available is False."
        try:
            resp = self.model.generate_content(prompt)
            text = getattr(resp, "text", "")
            return text.strip() or fallback
        except Exception as e:
            print("Gemini API Error:", e)
            return f"[API ERROR] {str(e)}"

    def recommendation_summary(
        self,
        student: dict[str, Any],
        prediction: dict[str, Any],
        universities: list[dict[str, Any]],
        career_paths: list[dict[str, Any]],
        experience_insights: str,
    ) -> str:
        prompt = RECOMMENDATION_PROMPT.format(
            name=student.get("name", "Student"),
            province=student.get("province", "Unknown"),
            budget=student.get("budget_range", "flexible"),
            top_grades=student.get("top_grades", "N/A"),
            interests=", ".join(student.get("interests", [])) or "general",
            top_major=prediction.get("top_major", "Unknown"),
            confidence=round(float(prediction.get("top_score", 0)) * 100, 2),
            alt_majors=", ".join([i["major"] for i in prediction.get("all_predictions", [])[1:]]) or "N/A",
            universities=universities,
            career_paths=career_paths,
            experience_insights=experience_insights,
        )
        fallback = (
            f"Based on your profile, {prediction.get('top_major', 'the recommended major')} fits your strengths and interests. "
            "This path can open practical career opportunities in Cambodia, and the listed universities provide strong options "
            "for different budgets. Keep improving your core subjects and communication skills to increase your success."
        )
        return self._generate(prompt, fallback)

    def chat_reply(self, context: dict[str, Any], message: str, history: list[dict[str, str]]) -> str:
        prompt = CHATBOT_SYSTEM_PROMPT.format(**context)
        conversation = "\n".join([f"{m['role']}: {m['content']}" for m in history[-12:]])
        full_prompt = f"{prompt}\n\nConversation:\n{conversation}\nuser: {message}"
        fallback = "Great question. Based on your profile, I recommend focusing on your top major while keeping one alternative option."
        return self._generate(full_prompt, fallback)


gemini_service = GeminiService()
