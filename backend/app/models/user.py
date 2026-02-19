from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, Literal
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


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
    role: Literal["student", "teacher", "admin"] = Field(default="student")


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
