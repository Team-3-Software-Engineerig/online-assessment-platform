from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.api.routes.auth import get_current_user
from app.api.deps import require_admin
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import create_user_with_role
from app.services import exam_service
import app.db.db as db_module
from bson import ObjectId

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _db():
    if db_module.database is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Database not connected")
    return db_module.database


@router.get("/students")
async def get_all_students(current_user: dict = Depends(get_current_user)):
    """Get all registered students for admin/manager view."""
    try:
        cursor = _db().users.find({"role": "student"})
        students = []
        async for student in cursor:
            students.append({
                "id": str(student["_id"]),
                "name": f"{student.get('name', '')} {student.get('surname', '')}".strip(),
                "mobile_phone": student.get("mobile_phone", ""),
                "is_active": student.get("is_active", True)
            })
        return students
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports")
async def get_all_reports(current_user: dict = Depends(get_current_user)):
    """Get all student reports for admin/teacher view."""
    try:
        cursor = _db().reports.find({})
        reports = []
        async for report in cursor:
            report["id"] = str(report["_id"])
            report["_id"] = str(report["_id"])
            if "student_id" in report:
                report["student_id"] = str(report["student_id"])
            if "exam_id" in report:
                report["exam_id"] = str(report["exam_id"])
            if "session_id" in report:
                report["session_id"] = str(report["session_id"])
            reports.append(report)
        return reports
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/exams/create", status_code=status.HTTP_201_CREATED)
async def create_exam(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a new exam with its questions."""
    try:
        from datetime import datetime
        
        exam_doc = {
            "title": data["title"],
            "subject": data["subject"],
            "duration_minutes": int(data["duration_minutes"]),
            "start_at": datetime.fromisoformat(data["start_at"]),
            "end_at": datetime.fromisoformat(data["end_at"]),
            "is_active": True,
            "questions": []
        }
        
        # Insert exam
        exam_result = await database.exams.insert_one(exam_doc)
        exam_id = exam_result.inserted_id
        
        # Insert questions
        questions_to_insert = []
        for q in data["questions"]:
            questions_to_insert.append({
                "number": int(q["number"]),
                "exam_id": exam_id,
                "statement": q["statement"],
                "type": q["type"],
                "answer": q["answer"],
                "options": q.get("options")
            })
            
        if questions_to_insert:
            q_result = await database.questions.insert_many(questions_to_insert)
            q_ids = list(q_result.inserted_ids)
            
            # Update exam with question IDs
            await database.exams.update_one(
                {"_id": exam_id},
                {"$set": {"questions": q_ids}}
            )
            
        return {"id": str(exam_id), "message": "Exam created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/exams")
async def get_all_exams(current_user: dict = Depends(get_current_user)):
    """Get all exams for admin/teacher view."""
    try:
        return await exam_service.get_all_exams()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/create", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_admin(
    user_data: UserCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new user (admin only)."""
    user_id = str(current_user["_id"])
    await require_admin(user_id)
    
    try:
        result = await create_user_with_role(
            mobile_phone=user_data.mobile_phone,
            name=user_data.name,
            surname=user_data.surname,
            password=user_data.password,
            role=user_data.role
        )
        return UserResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(exc)}")
