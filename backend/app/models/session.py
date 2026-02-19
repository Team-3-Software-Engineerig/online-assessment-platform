from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId


from .base import PyObjectId


class ExamSession(BaseModel):
    """Exam session model to track student progress"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    student_id: PyObjectId = Field(...)
    exam_id: PyObjectId = Field(...)
    session_token: str = Field(...)  # Unique token for this session
    started_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(...)
    finished_at: Optional[datetime] = None
    status: str = Field(default="active")  # active, completed, expired
    current_question_number: int = Field(default=1)
    responses: dict[str, str] = Field(default_factory=dict)  # question_id -> response
