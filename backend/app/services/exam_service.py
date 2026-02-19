from datetime import datetime, timedelta
import uuid
from typing import List, Optional
from bson import ObjectId
import app.db.db as db


def _db():
    """Always return the current live database object."""
    if db.database is None:
        raise RuntimeError("Database not connected")
    return db.database


async def get_active_exams():
    """Fetch all active exams from the database."""
    now = datetime.utcnow()
    cursor = _db().exams.find({"start_at": {"$lte": now}, "end_at": {"$gte": now}})
    exams = []
    async for exam in cursor:
        exam["id"] = str(exam["_id"])
        exam["_id"] = str(exam["_id"])
        # Serialize any ObjectId lists (e.g., questions)
        if "questions" in exam and isinstance(exam["questions"], list):
            exam["questions"] = [str(q) for q in exam["questions"]]
        exams.append(exam)
    return exams


async def get_all_exams():
    """Fetch all exams (for admin/teacher view)."""
    cursor = _db().exams.find({})
    exams = []
    async for exam in cursor:
        exam["id"] = str(exam["_id"])
        exam["_id"] = str(exam["_id"])
        if "questions" in exam and isinstance(exam["questions"], list):
            exam["questions"] = [str(q) for q in exam["questions"]]
        exams.append(exam)
    return exams


async def get_exam_by_id(exam_id: str):
    """Fetch a specific exam by ID."""
    exam = await _db().exams.find_one({"_id": ObjectId(exam_id)})
    if exam:
        exam["id"] = str(exam["_id"])
        exam["_id"] = str(exam["_id"])
        if "questions" in exam and isinstance(exam["questions"], list):
            exam["questions"] = [str(q) for q in exam["questions"]]
    return exam


async def get_questions_for_exam(exam_id: str):
    """Fetch all questions associated with an exam (without answers)."""
    cursor = _db().questions.find({"exam_id": ObjectId(exam_id)}).sort("number", 1)
    questions = []
    async for q in cursor:
        q["id"] = str(q["_id"])
        q["_id"] = str(q["_id"])
        q["exam_id"] = str(q["exam_id"])
        # Don't send the correct answer to the client!
        if "answer" in q:
            del q["answer"]
        questions.append(q)
    return questions


async def start_exam_session(student_id: str, exam_id: str):
    """Initialize a new exam session for a student."""
    exam = await get_exam_by_id(exam_id)
    if not exam:
        raise ValueError("Exam not found")
        
    # Check if student already has any session for this exam
    session = await _db().exam_sessions.find_one({
        "student_id": ObjectId(student_id),
        "exam_id": ObjectId(exam_id)
    })
    
    if session:
        if session["status"] == "completed":
            raise ValueError("You have already completed this exam")
        session["id"] = str(session["_id"])
        session["_id"] = str(session["_id"])
        session["student_id"] = str(session["student_id"])
        session["exam_id"] = str(session["exam_id"])
        return session
        
    # Create new session
    duration_minutes = exam.get("duration_minutes", 60)
    expires_at = datetime.utcnow() + timedelta(minutes=duration_minutes)
    
    session_doc = {
        "student_id": ObjectId(student_id),
        "exam_id": ObjectId(exam_id),
        "session_token": str(uuid.uuid4()),
        "started_at": datetime.utcnow(),
        "expires_at": expires_at,
        "status": "active",
        "current_question_number": 1,
        "responses": {}
    }
    
    result = await _db().exam_sessions.insert_one(session_doc)
    session_doc["id"] = str(result.inserted_id)
    session_doc["_id"] = str(result.inserted_id)
    session_doc["student_id"] = str(session_doc["student_id"])
    session_doc["exam_id"] = str(session_doc["exam_id"])
    return session_doc


async def submit_question_answer(session_token: str, question_id: str, answer_text: str):
    """Submit or update an answer for a specific question in a session."""
    session = await _db().exam_sessions.find_one({"session_token": session_token, "status": "active"})
    if not session:
        raise ValueError("Invalid or inactive session")
        
    if datetime.utcnow() > session["expires_at"]:
        await _db().exam_sessions.update_one(
            {"_id": session["_id"]},
            {"$set": {"status": "expired"}}
        )
        raise ValueError("Session expired")
        
    update_query = {f"responses.{question_id}": answer_text}
    await _db().exam_sessions.update_one(
        {"_id": session["_id"]},
        {"$set": update_query}
    )
    return {"success": True}


async def complete_exam_session(session_token: str):
    """Mark an exam session as completed."""
    session = await _db().exam_sessions.find_one({"session_token": session_token, "status": "active"})
    if not session:
        raise ValueError("Invalid or inactive session")
        
    await _db().exam_sessions.update_one(
        {"_id": session["_id"]},
        {
            "$set": {
                "status": "completed",
                "finished_at": datetime.utcnow()
            }
        }
    )
    return {"success": True, "session_id": str(session["_id"])}
