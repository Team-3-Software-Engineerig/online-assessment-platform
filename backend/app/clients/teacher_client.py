"""Teacher database client - handles all MongoDB operations for teachers"""
from typing import Optional
from bson import ObjectId
from app.db import db


async def find_teacher_by_user_id(user_id: str) -> Optional[dict]:
    """Find teacher by user_id."""
    if db.database is None:
        raise ValueError("Database not initialized")
    if not ObjectId.is_valid(user_id):
        return None
    return await db.database.teachers.find_one({"user_id": ObjectId(user_id)})


async def create_teacher(teacher_doc: dict) -> str:
    """Create a new teacher. Returns teacher_id as string."""
    if db.database is None:
        raise ValueError("Database not initialized")
    result = await db.database.teachers.insert_one(teacher_doc)
    return str(result.inserted_id)

