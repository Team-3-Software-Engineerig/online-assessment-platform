from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId


from .base import PyObjectId


class User(BaseModel):
    """User model for authentication only"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    mobile_phone: str = Field(..., unique=True)  # Mobile phone number (unique)
    name: str = Field(..., min_length=1)
    surname: str = Field(..., min_length=1)
    password_hash: str
    is_active: bool = Field(default=True)
    role: Literal["student", "teacher", "admin", "manager"] = Field(default="student")


class Student(BaseModel):
    """Student model with reference to user"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(..., unique=True)  # Reference to users._id
    exam_history: list[PyObjectId] = Field(default_factory=list)  # List of exam IDs


class Teacher(BaseModel):
    """Teacher model with reference to user"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(..., unique=True)  # Reference to users._id
    exams: list[PyObjectId] = Field(default_factory=list)  # List of exam IDs created by this teacher
