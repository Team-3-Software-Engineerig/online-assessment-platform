from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from app.api.routes.auth import get_current_user
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import create_user_with_role
from app.schemas.registration_request import (
    RegistrationRequestApprove,
    RegistrationRequestReject,
    RegistrationRequestResponse,
)
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
            first_name = student.get('name', '')
            last_name = student.get('surname', '')
            students.append({
                "id": str(student["_id"]),
                "name": f"{first_name} {last_name}".strip(),
                "firstName": first_name,
                "lastName": last_name,
                "mobile_phone": student.get("mobile_phone", ""),
                "mobilePhone": student.get("mobile_phone", ""),
                "email": student.get("email", f"{first_name.lower()}.{last_name.lower()}@ucaschool.edu" if first_name else "student@ucaschool.edu"),
                "grade": student.get("grade", "9"),
                "section": student.get("section", "A"),
                "is_active": student.get("is_active", True)
            })
        return students
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports")
async def get_all_reports(current_user: dict = Depends(get_current_user)):
    """Get all student reports for admin/teacher view, enriched with student and exam info."""
    try:
        cursor = _db().reports.find({})
        reports = []
        async for report in cursor:
            # Serialize IDs
            report_data = {
                "id": str(report["_id"]),
                "student_id": str(report.get("student_id", "")),
                "exam_id": str(report.get("exam_id", "")),
                "session_id": str(report.get("session_id", "")),
                "score": report.get("score", 0),
                "total": report.get("total", 0),
                "percentage": report.get("percentage", 0),
                "created_at": report.get("created_at"),
            }
            
            # Enrich with student info
            try:
                student = await _db().users.find_one({"_id": report["student_id"]})
                if student:
                    report_data["student_name"] = f"{student.get('name', '')} {student.get('surname', '')}".strip()
                    report_data["student_phone"] = student.get("mobile_phone", "")
            except Exception:
                pass
            
            # Enrich with exam info
            try:
                exam = await _db().exams.find_one({"_id": report["exam_id"]})
                if exam:
                    report_data["exam_title"] = exam.get("title", "Unknown Exam")
                    report_data["exam_subject"] = exam.get("subject", "")
            except Exception:
                pass
                
            reports.append(report_data)
        return reports
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/teachers")
async def get_all_teachers(current_user: dict = Depends(get_current_user)):
    """Get all registered teachers for admin view."""
    try:
        cursor = _db().users.find({"role": "teacher"})
        teachers = []
        async for teacher in cursor:
            first_name = teacher.get('name', '')
            last_name = teacher.get('surname', '')
            teachers.append({
                "id": str(teacher["_id"]),
                "name": f"{first_name} {last_name}".strip(),
                "firstName": first_name,
                "lastName": last_name,
                "mobile_phone": teacher.get("mobile_phone", ""),
                "mobilePhone": teacher.get("mobile_phone", ""),
                "subject": teacher.get("subject", ""),
                "is_active": teacher.get("is_active", True)
            })
        return teachers
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/managers")
async def get_all_managers(current_user: dict = Depends(get_current_user)):
    """Get all registered managers."""
    # Only admins can see the list of managers
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view managers")
        
    try:
        cursor = _db().users.find({"role": "manager"})
        managers = []
        async for manager in cursor:
            first_name = manager.get('name', '')
            last_name = manager.get('surname', '')
            managers.append({
                "id": str(manager["_id"]),
                "name": f"{first_name} {last_name}".strip(),
                "firstName": first_name,
                "lastName": last_name,
                "mobile_phone": manager.get("mobile_phone", ""),
                "mobilePhone": manager.get("mobile_phone", ""),
                "is_active": manager.get("is_active", True)
            })
        return managers
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/registration-requests", response_model=list[RegistrationRequestResponse])
async def get_registration_requests(current_user: dict = Depends(get_current_user)):
    """Get pending registration requests for admin review."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view registration requests")

    requests = []
    cursor = _db().registration_requests.find({}).sort("created_at", -1)
    async for req in cursor:
        requests.append(
            RegistrationRequestResponse(
                id=str(req["_id"]),
                mobile_phone=req.get("mobile_phone", ""),
                mobilePhone=req.get("mobile_phone", ""),
                name=req.get("name", ""),
                surname=req.get("surname", ""),
                firstName=req.get("name", ""),
                lastName=req.get("surname", ""),
                        school=req.get("school"),
                        emergency_contact=req.get("emergency_contact"),
                        email=req.get("email"),
                role=req.get("role", ""),
                subject=req.get("subject"),
                status=req.get("status", "pending"),
                created_at=req.get("created_at"),
                reviewed_at=req.get("reviewed_at"),
                review_note=req.get("review_note"),
            )
        )
    return requests


@router.post("/registration-requests/{request_id}/approve", status_code=status.HTTP_200_OK)
async def approve_registration_request(
    request_id: str,
    payload: RegistrationRequestApprove,
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can approve registration requests")
    if not ObjectId.is_valid(request_id):
        raise HTTPException(status_code=400, detail="Invalid request id")

    request_doc = await _db().registration_requests.find_one({"_id": ObjectId(request_id)})
    if not request_doc:
        raise HTTPException(status_code=404, detail="Registration request not found")
    if request_doc.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Request is already reviewed")

    try:
        created = await create_user_with_role(
            mobile_phone=request_doc.get("mobile_phone", ""),
            name=request_doc.get("name", ""),
            surname=request_doc.get("surname", ""),
            password=payload.password,
            role=request_doc.get("role", ""),
            subject=request_doc.get("subject"),
        )
        await _db().registration_requests.update_one(
            {"_id": ObjectId(request_id)},
            {
                "$set": {
                    "status": "approved",
                    "reviewed_at": datetime.utcnow(),
                    "review_note": "Approved by admin",
                    "created_user_id": created.get("id"),
                }
            },
        )
        return {"message": "Request approved and user created", "user": created}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to approve request: {str(exc)}")


@router.post("/registration-requests/{request_id}/reject", status_code=status.HTTP_200_OK)
async def reject_registration_request(
    request_id: str,
    payload: RegistrationRequestReject,
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can reject registration requests")
    if not ObjectId.is_valid(request_id):
        raise HTTPException(status_code=400, detail="Invalid request id")

    result = await _db().registration_requests.update_one(
        {"_id": ObjectId(request_id), "status": "pending"},
        {
            "$set": {
                "status": "rejected",
                "reviewed_at": datetime.utcnow(),
                "review_note": payload.reason or "Rejected by admin",
            }
        },
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pending request not found")
    return {"message": "Request rejected"}


@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user_permanently(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Permanently delete a user and any role-specific document."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete users")

    try:
        user_filters = [{"_id": user_id}]
        if ObjectId.is_valid(user_id):
            user_filters.insert(0, {"_id": ObjectId(user_id)})

        user_doc = await _db().users.find_one({"$or": user_filters})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")

        stored_user_id = user_doc.get("_id")
        role = user_doc.get("role")
        if role == "student":
            await _db().students.delete_many({"user_id": {"$in": [stored_user_id, user_id]}})
        elif role == "teacher":
            await _db().teachers.delete_many({"user_id": {"$in": [stored_user_id, user_id]}})

        await _db().users.delete_one({"_id": stored_user_id})
        return {"message": "User deleted permanently", "id": user_id, "role": role}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(exc)}")


@router.post("/exams/create", status_code=status.HTTP_201_CREATED)
async def create_exam(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a new exam with its questions."""
    # Security: Only admin and teacher can create exams
    if current_user.get("role") not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Only admins and teachers can create exams")
        
    try:
        from datetime import datetime, timedelta
        
        # Handle duration name mismatch
        duration = data.get("duration") or data.get("duration_minutes") or 60
        
        # Handle start/end dates with defaults
        now = datetime.utcnow()
        start_at_str = data.get("start_at")
        end_at_str = data.get("end_at")
        
        try:
            start_at = datetime.fromisoformat(start_at_str) if start_at_str else now
        except Exception:
            start_at = now
            
        try:
            end_at = datetime.fromisoformat(end_at_str) if end_at_str else now + timedelta(days=7)
        except Exception:
            end_at = now + timedelta(days=7)
        
        exam_doc = {
            "title": data.get("title", "Untitled Exam"),
            "subject": data.get("subject", "General"),
            "duration_minutes": int(duration),
            "start_at": start_at,
            "end_at": end_at,
            "is_active": data.get("is_active", True),
            "questions": [],
            "assigned_students": data.get("assigned_students", []), # List of mobile phones
            "creator_id": current_user.get("_id")
        }
        
        # Insert exam
        exam_result = await _db().exams.insert_one(exam_doc)
        exam_id = exam_result.inserted_id
        
        # Insert questions
        questions_to_insert = []
        for i, q in enumerate(data.get("questions", [])):
            # Handle field name mismatches
            statement = q.get("statement") or q.get("questionText") or ""
            q_type = q.get("type", "MCQ")
            
            # Handle options format (frontend sends array, backend wants dict)
            options = q.get("options", {})
            answer = q.get("answer", "a")
            
            if isinstance(options, list):
                # Convert list of {text, isCorrect} to dict {a: text, b: text}
                new_options = {}
                for idx, opt in enumerate(options):
                    key = chr(ord('a') + idx)
                    new_options[key] = opt.get("text", "")
                    if opt.get("isCorrect"):
                        answer = key
                options = new_options

            questions_to_insert.append({
                "number": q.get("number", i + 1),
                "exam_id": exam_id,
                "statement": statement,
                "type": q_type,
                "answer": answer,
                "options": options
            })
            
        if questions_to_insert:
            q_result = await _db().questions.insert_many(questions_to_insert)
            q_ids = list(q_result.inserted_ids)
            await _db().exams.update_one({"_id": exam_id}, {"$set": {"questions": q_ids}})
            
        return {"id": str(exam_id), "message": "Exam created successfully"}
    except Exception as e:
        print(f"Error creating exam: {e}")
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


@router.put("/exams/{exam_id}/assignments")
async def update_exam_assignments(
    exam_id: str,
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update assigned students for an exam."""
    if current_user.get("role") not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    assigned_students = data.get("assigned_students", [])
    try:
        result = await _db().exams.update_one(
            {"_id": ObjectId(exam_id)},
            {"$set": {"assigned_students": assigned_students}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Exam not found")
        return {"message": "Assignments updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/create", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_admin(
    user_data: UserCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new user. Accessible by admin and manager roles."""
    caller_role = current_user.get("role", "")
    if caller_role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and managers can create users."
        )
    if not user_data.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required when creating users."
        )

    try:
        result = await create_user_with_role(
            mobile_phone=user_data.mobile_phone,
            name=user_data.name,
            surname=user_data.surname,
            password=user_data.password,
            role=user_data.role,
            subject=user_data.subject
        )
        return UserResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(exc)}")
