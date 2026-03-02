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


def serialize_doc(doc):
    """Recursively convert ObjectIds in a document to strings."""
    if doc is None:
        return None
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, list):
        return [serialize_doc(i) for i in doc]
    if isinstance(doc, dict):
        new_doc = {}
        for k, v in doc.items():
            if k == "_id":
                new_doc[k] = str(v)
                new_doc["id"] = str(v)
            else:
                new_doc[k] = serialize_doc(v)
        return new_doc
    return doc


async def get_active_exams(student_mobile: str = None, student_id: str = None):
    """Fetch all active exams from the database."""
    now = datetime.utcnow()
    # Basic query for time-active and enabled exams
    cursor = _db().exams.find({
        "is_active": True,
        "start_at": {"$lte": now},
        "end_at": {"$gte": now}
    })
    
    exams = []
    async for exam in cursor:
        # Check assignment if student_mobile is provided
        assigned = exam.get("assigned_students", [])
        if assigned and student_mobile:
            # Normalize for comparison: remove all non-digits
            sm = "".join(filter(str.isdigit, str(student_mobile)))
            as_normalized = ["".join(filter(str.isdigit, str(a))) for a in assigned]
            if sm not in as_normalized:
                continue
        
        exam_data = serialize_doc(exam)
        
        # Check if student completed it
        if student_id:
            session = await _db().exam_sessions.find_one({
                "student_id": ObjectId(student_id),
                "exam_id": exam["_id"],
                "status": "completed"
            })
            if session:
                exam_data["is_completed"] = True
                exam_data["completed_at"] = session.get("finished_at")
        
        exams.append(exam_data)
    return exams


async def get_all_exams():
    """Fetch all exams (for admin/teacher view)."""
    cursor = _db().exams.find({}).sort("created_at", -1)
    exams = []
    async for exam in cursor:
        exam_data = serialize_doc(exam)
        
        # Add submission count
        count = await _db().exam_sessions.count_documents({
            "exam_id": exam["_id"],
            "status": "completed"
        })
        exam_data["submission_count"] = count
        
        # Also ensure questions count is present
        if not exam_data.get("questions_count"):
            q_count = await _db().questions.count_documents({"exam_id": exam["_id"]})
            exam_data["questions_count"] = q_count
            
        exams.append(exam_data)
    return exams


async def get_exam_by_id(exam_id: str):
    """Fetch a specific exam by ID."""
    exam = await _db().exams.find_one({"_id": ObjectId(exam_id)})
    return serialize_doc(exam) if exam else None


async def get_questions_for_exam(exam_id: str):
    """Fetch all questions associated with an exam (without answers)."""
    cursor = _db().questions.find({"exam_id": ObjectId(exam_id)}).sort("number", 1)
    questions = []
    async for q in cursor:
        serialized = serialize_doc(q)
        # Don't send the correct answer to the client!
        if "answer" in serialized:
            del serialized["answer"]
        questions.append(serialized)
    return questions


async def start_exam_session(student_id: str, exam_id: str):
    """Initialize a new exam session for a student."""
    print(f"DEBUG: Starting session for student_id={student_id}, exam_id={exam_id}")
    
    # Try to find user by ID or mobile phone to get the real ObjectId
    user = None
    try:
        # 1. Try by ObjectId
        if len(student_id) == 24:
            user = await _db().users.find_one({"_id": ObjectId(student_id)})
    except Exception:
        pass
        
    if not user:
        # 2. Try by mobile phone
        user = await _db().users.find_one({"mobile_phone": student_id})
        
    if not user:
        print(f"DEBUG: User not found for student_id={student_id}")
        raise ValueError(f"Student not found: {student_id}")
        
    actual_student_id = user["_id"]
    student_phone = user.get("mobile_phone")
    
    exam = await get_exam_by_id(exam_id)
    if not exam:
        raise ValueError("Exam not found")

    # Assignment check
    assigned_students = exam.get("assigned_students", [])
    if assigned_students:
        # Normalize for comparison
        clean_phone = "".join(filter(str.isdigit, str(student_phone)))
        assigned_normalized = ["".join(filter(str.isdigit, str(a))) for a in assigned_students]
        
        assigned_by_id = [str(a) for a in assigned_students]
        
        if str(actual_student_id) not in assigned_by_id and clean_phone not in assigned_normalized:
            print(f"DEBUG: Assignment check failed for {clean_phone}")
            raise ValueError("You are not assigned to this exam")
        
    # Check if student already has any session for this exam
    session = await _db().exam_sessions.find_one({
        "student_id": actual_student_id,
        "exam_id": ObjectId(exam_id)
    })
    
    if session:
        if session["status"] == "completed":
            raise ValueError("You have already completed this exam")
        session["id"] = str(session["_id"])
        session["token"] = session.get("session_token")
        return serialize_doc(session)
        
    # Create new session
    duration_minutes = exam.get("duration_minutes", 60)
    expires_at = datetime.utcnow() + timedelta(minutes=duration_minutes)
    
    session_doc = {
        "student_id": actual_student_id,
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
    session_doc["token"] = session_doc["session_token"]
    return serialize_doc(session_doc)


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
    """Mark an exam session as completed and calculate the score."""
    from app.services.report_service import calculate_score

    session = await _db().exam_sessions.find_one({"session_token": session_token, "status": "active"})
    if not session:
        # Check if already completed
        session = await _db().exam_sessions.find_one({"session_token": session_token, "status": "completed"})
        if session:
            return {"success": True, "message": "Already completed", "session_id": str(session["_id"])}
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

    # Calculate score immediately
    try:
        await calculate_score(str(session["_id"]))
    except Exception as e:
        print(f"Error calculating score: {e}")
        
    return {"success": True, "session_id": str(session["_id"])}
