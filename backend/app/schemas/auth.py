from pydantic import BaseModel, Field


class UserLogin(BaseModel):
    """User login schema"""
    mobile_phone: str = Field(..., min_length=10, description="Mobile phone number")
    password: str


class Token(BaseModel):
    """Token response schema"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token data schema"""
    user_id: str
