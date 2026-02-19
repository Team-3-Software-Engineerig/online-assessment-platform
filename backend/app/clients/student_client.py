"""Student database client - handles all MongoDB operations for students"""
from typing import Optional
from bson import ObjectId
from app.db import db


async def find_student_by_user_id(user_id: str) -> Optional[dict]:
    """Find student by user_id."""
    if db.database is None:
        raise ValueError("Database not initialized")
    if not ObjectId.is_valid(user_id):
        return None
    return await db.database.students.find_one({"user_id": ObjectId(user_id)})


async def create_student(student_doc: dict) -> str:
    """Create a new student. Returns student_id as string."""
    if db.database is None:
        raise ValueError("Database not initialized")
    result = await db.database.students.insert_one(student_doc)
    return str(result.inserted_id)


async def add_exam_to_history(student_id: str, exam_id: str) -> None:
    """Add exam to student's exam history."""
    if db.database is None:
        raise ValueError("Database not initialized")
    if not ObjectId.is_valid(student_id) or not ObjectId.is_valid(exam_id):
        raise ValueError("Invalid ID format")
    await db.database.students.update_one(
        {"_id": ObjectId(student_id)},
        {"$push": {"exam_history": ObjectId(exam_id)}}
    )

