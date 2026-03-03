from typing import Optional, Literal
from pydantic import BaseModel, HttpUrl, Field, ConfigDict, model_validator
from bson import ObjectId


from .base import PyObjectId


class Question(BaseModel):
    """Question model with composite index on (exam_id, number)"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    number: int = Field(..., ge=1)  # Starts from 1 for given exam
    exam_id: PyObjectId = Field(...)
    statement: str = Field(..., min_length=1)
    media_url: Optional[HttpUrl] = None
    type: Literal["MCQ", "Open-ended"] = Field(...)
    answer: Optional[str] = Field(None)  # "a", "b", "c", "d" for MCQ, None for Open-ended
    
    @model_validator(mode='after')
    def validate_answer(self):
        """Validate answer based on question type"""
        if self.type == "MCQ":
            if self.answer not in ["a", "b", "c", "d"]:
                raise ValueError("MCQ answer must be one of: a, b, c, d")
        elif self.type == "Open-ended":
            if self.answer is not None:
                raise ValueError("Open-ended questions should have answer=None")
        return self
