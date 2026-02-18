from pydantic import BaseModel, Field
from typing import Literal


class UserCreate(BaseModel):
    """Schema for creating a new user (admin only)"""
    mobile_phone: str = Field(..., min_length=10, description="Mobile phone number")
    name: str = Field(..., min_length=1, description="First name")
    surname: str = Field(..., min_length=1, description="Last name")
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    role: Literal["student", "teacher", "admin"] = Field(..., description="User role")


class UserResponse(BaseModel):
    """Schema for user response"""
    id: str
    mobile_phone: str
    name: str
    surname: str
    role: str
    is_active: bool
    
    class Config:
        from_attributes = True
