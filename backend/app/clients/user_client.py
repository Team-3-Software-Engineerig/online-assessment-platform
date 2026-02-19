from typing import Optional
from bson import ObjectId
from app.db import db


async def find_user_by_mobile_phone(mobile_phone: str) -> Optional[dict]:
    """Find user by mobile phone."""
    if db.database is None:
        raise ValueError("Database not initialized")
    return await db.database.users.find_one({"mobile_phone": mobile_phone})


async def find_user_by_id(user_id: str) -> Optional[dict]:
    """Find user by ID."""
    if db.database is None:
        raise ValueError("Database not initialized")
    if not ObjectId.is_valid(user_id):
        return None
    return await db.database.users.find_one({"_id": ObjectId(user_id)})


async def create_user(user_doc: dict) -> str:
    """Create a new user. Returns user_id as string."""
    if db.database is None:
        raise ValueError("Database not initialized")
    result = await db.database.users.insert_one(user_doc)
    return str(result.inserted_id)


async def is_user_admin(user_id: str) -> bool:
    """Check if user is admin."""
    user = await find_user_by_id(user_id)
    if not user:
        return False
    return user.get("role") == "admin"
