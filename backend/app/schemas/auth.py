from pydantic import BaseModel, Field
from typing import Optional


class UserLogin(BaseModel):
    """User login schema"""
    mobile_phone: str = Field(..., min_length=10, description="Mobile phone number")
    password: str


class Token(BaseModel):
    """Token response schema"""
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    name: str
    surname: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    mobilePhone: Optional[str] = None


class TokenData(BaseModel):
    """Token data schema"""
    user_id: str
