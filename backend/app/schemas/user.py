from pydantic import BaseModel, Field, AliasChoices
from typing import Literal, Optional


class UserCreate(BaseModel):
    """Schema for creating a new user. Supports both frontend and backend field names."""
    mobile_phone: str = Field(
        ..., 
        validation_alias=AliasChoices('mobile_phone', 'mobilePhone'),
        pattern=r'^\+?[0-9]{10,15}$'
    )
    name: str = Field(..., validation_alias=AliasChoices('name', 'firstName'), min_length=2)
    surname: str = Field(..., validation_alias=AliasChoices('surname', 'lastName'), min_length=2)
    password: Optional[str] = Field(None, min_length=6)
    role: Literal["student", "teacher", "admin", "manager"] = Field(..., description="User role")


class UserResponse(BaseModel):
    """Schema for user response"""
    id: str
    mobile_phone: str
    name: str
    surname: str
    role: str
    is_active: bool
    access_token: Optional[str] = None
    token_type: Optional[str] = "bearer"
    
    class Config:
        from_attributes = True
