"""User service - business logic for user management"""
from app.clients.user_client import find_user_by_mobile_phone, create_user
from app.clients.student_client import create_student
from app.clients.teacher_client import create_teacher
from app.core.security import get_password_hash
from bson import ObjectId


async def create_user_with_role(mobile_phone: str, name: str, surname: str, password: str, role: str, subject: str = None) -> dict:
    """
    Create a new user with the specified role. Used by Admin/Manager.
    """
    return await create_user_full(mobile_phone, name, surname, password, role, subject)

async def self_register_user(mobile_phone: str, name: str, surname: str, password: str, role: str, subject: str = None) -> dict:
    """
    Allow a student or teacher to register themselves ONLY if they were pre-assigned by a manager.
    """
    from app.clients.user_client import update_user
    
    # Check if user already exists
    existing_user = await find_user_by_mobile_phone(mobile_phone)
    if not existing_user:
        raise ValueError("You have not been assigned by a manager. Please contact your administrator to be added to the system.")
    
    # Check if role matches
    if existing_user.get("role") != role:
        raise ValueError(f"Mobile number registered but not with the role: {role}. Please contact support.")
        
    # Prepare update data
    update_data = {
        "name": name,
        "surname": surname,
        "is_active": True
    }
    
    if password:
        update_data["password_hash"] = get_password_hash(password)
    
    if subject:
        update_data["subject"] = subject
        
    # Update user record
    user_id = str(existing_user["_id"])
    await update_user(user_id, update_data)
    
    # If it's a teacher, we might need to update the role-specific record too if subject changed
    if role == "teacher" and subject:
        from app.db import db
        await db.database.teachers.update_one(
            {"user_id": ObjectId(user_id)},
            {"$set": {"subject": subject}}
        )

    return {
        "id": user_id,
        "mobile_phone": mobile_phone,
        "mobilePhone": mobile_phone,
        "name": name,
        "surname": surname,
        "firstName": name,
        "lastName": surname,
        "role": role,
        "subject": subject or existing_user.get("subject"),
        "is_active": True
    }

async def create_user_full(mobile_phone: str, name: str, surname: str, password: str, role: str, subject: str = None) -> dict:
    """
    Create a new user with the specified role and optional subject.
    """
    # Check if user already exists
    existing_user = await find_user_by_mobile_phone(mobile_phone)
    if existing_user:
        raise ValueError("Mobile phone number already registered")
    
    # Use mobile phone as default password if not provided (for students/managers)
    if not password:
        password = mobile_phone
        
    # Hash password
    password_hash = get_password_hash(password)
    
    # Create user document
    user_doc = {
        "mobile_phone": mobile_phone,
        "name": name,
        "surname": surname,
        "password_hash": password_hash,
        "is_active": True,
        "role": role,
        "subject": subject
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
            "exams": [],
            "subject": subject
        }
        await create_teacher(teacher_doc)
    # Admin doesn't need a separate document
    
    return {
        "id": user_id,
        "mobile_phone": mobile_phone,
        "mobilePhone": mobile_phone,
        "name": name,
        "surname": surname,
        "firstName": name,
        "lastName": surname,
        "role": role,
        "subject": subject,
        "is_active": True
    }
