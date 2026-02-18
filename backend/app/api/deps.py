from fastapi import HTTPException, status
from app.clients.user_client import find_user_by_id, is_user_admin
from app.clients.student_client import find_student_by_user_id
from app.clients.teacher_client import find_teacher_by_user_id


async def is_admin(user_id: str) -> bool:
    """
    Check if user is an admin.
    Returns True if user has admin role, False otherwise.
    """
    return await is_user_admin(user_id)


async def require_teacher(user_id: str) -> dict:
    """
    Verify that user_id exists in teachers collection.
    Admin users can bypass this check.
    Raises HTTP 403 if not found and user is not admin.
    """
    from bson import ObjectId
    
    # Admin can access anything
    if await is_admin(user_id):
        return {"user_id": ObjectId(user_id), "role": "admin"}
    
    teacher = await find_teacher_by_user_id(user_id)
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher authorization required"
        )
    
    return teacher


async def require_student(user_id: str) -> dict:
    """
    Verify that user_id exists in students collection.
    Admin users can bypass this check.
    Raises HTTP 403 if not found and user is not admin.
    """
    from bson import ObjectId
    
    # Admin can access anything
    if await is_admin(user_id):
        return {"user_id": ObjectId(user_id), "role": "admin"}
    
    student = await find_student_by_user_id(user_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student authorization required"
        )
    
    return student


async def require_admin(user_id: str) -> dict:
    """
    Verify that user is an admin.
    Raises HTTP 403 if user is not admin.
    """
    if not await is_admin(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin authorization required"
        )
    
    user = await find_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user
