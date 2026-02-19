from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.services import exam_service
from pydantic import BaseModel

router = APIRouter(prefix="/api/exams", tags=["exams"])

class AnswerSubmission(BaseModel):
    session_token: str
    question_id: str
    answer_text: str

class SessionStart(BaseModel):
    student_id: str
    exam_id: str

@router.get("/active")
async def list_active_exams():
    """List all exams currently available."""
    try:
        return await exam_service.get_active_exams()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{exam_id}")
async def get_exam_details(exam_id: str):
    """Get basic info about an exam."""
    exam = await exam_service.get_exam_by_id(exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam

@router.get("/{exam_id}/questions")
async def get_exam_questions(exam_id: str):
    """Get all questions for an exam (without answers)."""
    try:
        return await exam_service.get_questions_for_exam(exam_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sessions/start")
async def start_session(data: SessionStart):
    """Start or resume an exam session."""
    try:
        return await exam_service.start_exam_session(data.student_id, data.exam_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sessions/submit-answer")
async def submit_answer(data: AnswerSubmission):
    """Submit an answer for a question."""
    try:
        return await exam_service.submit_question_answer(data.session_token, data.question_id, data.answer_text)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sessions/complete/{session_token}")
async def complete_session(session_token: str):
    """Finish the exam session."""
    try:
        return await exam_service.complete_exam_session(session_token)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
