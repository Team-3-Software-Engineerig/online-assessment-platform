"""User service - business logic for user management"""
from app.clients.user_client import find_user_by_mobile_phone, create_user
from app.clients.student_client import create_student
from app.clients.teacher_client import create_teacher
from app.core.security import get_password_hash
from bson import ObjectId


async def create_user_with_role(mobile_phone: str, name: str, surname: str, password: str, role: str) -> dict:
    """
    Create a new user with the specified role.
    
    Args:
        mobile_phone: User mobile phone
        name: User first name
        surname: User last name
        password: User password
        role: User role (student, teacher, admin)
    
    Returns:
        dict with user details
    
    Raises:
        ValueError: If mobile phone already exists or invalid role
    """
    # Check if user already exists
    existing_user = await find_user_by_mobile_phone(mobile_phone)
    if existing_user:
        raise ValueError("Mobile phone number already registered")
    
    # Hash password
    password_hash = get_password_hash(password)
    
    # Create user document
    user_doc = {
        "mobile_phone": mobile_phone,
        "name": name,
        "surname": surname,
        "password_hash": password_hash,
        "is_active": True,
        "role": role
    }
    
    # Create user
    user_id = await create_user(user_doc)
    created_user_id = ObjectId(user_id)
    
    # Create role-specific document
    if role == "student":
        student_doc = {
            "user_id": created_user_id,
            "exam_history": []
        }
        await create_student(student_doc)
    elif role == "teacher":
        teacher_doc = {
            "user_id": created_user_id,
            "exams": []
        }
        await create_teacher(teacher_doc)
    # Admin doesn't need a separate document
    
    return {
        "id": user_id,
        "mobile_phone": mobile_phone,
        "name": name,
        "surname": surname,
        "role": role,
        "is_active": True
    }
