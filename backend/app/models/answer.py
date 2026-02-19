from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId


from .base import PyObjectId


class Answer(BaseModel):
    """Answer model for a single question response"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    student_id: PyObjectId = Field(...)
    exam_id: PyObjectId = Field(...)
    question_id: PyObjectId = Field(...)
    selected_option: Optional[str] = None  # "a", "b", "c", "d"
    text_answer: Optional[str] = None  # For open-ended
    is_correct: Optional[bool] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
