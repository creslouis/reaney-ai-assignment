from datetime import datetime

from pydantic import BaseModel


class ChatSendRequest(BaseModel):
    session_id: str
    student_id: str
    message: str


class ChatSendResponse(BaseModel):
    reply: str
    session_id: str


class ChatHistoryItem(BaseModel):
    role: str
    message: str
    created_at: datetime
