from pydantic import BaseModel, EmailStr, Field


class ContactSendRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str | None = None
    message: str = Field(min_length=1)


class ContactResponse(BaseModel):
    success: bool
