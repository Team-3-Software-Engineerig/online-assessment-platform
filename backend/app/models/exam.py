from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, model_validator
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


class Exam(BaseModel):
    """Exam model with list of question IDs and availability window"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    questions: list[PyObjectId] = Field(default_factory=list)  # List of question IDs
    start_at: datetime = Field(..., description="When the exam becomes accessible")
    end_at: datetime = Field(..., description="When the exam becomes inaccessible")
    
    @model_validator(mode='after')
    def validate_time_window(self):
        """Validate that end_at is after start_at"""
        if self.end_at <= self.start_at:
            raise ValueError("end_at must be after start_at")
        return self
