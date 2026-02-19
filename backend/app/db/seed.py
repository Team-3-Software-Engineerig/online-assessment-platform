from app.core.config import settings
from app.core.security import get_password_hash, verify_password


async def seed_admin_user(database):
    """
    Ensure admin user exists in the database.
    Creates admin user if it doesn't exist.
    
    Args:
        database: MongoDB database instance
    """
    if database is None:
        return
    
    admin_mobile_phone = settings.ADMIN_MOBILE_PHONE
    admin_name = settings.ADMIN_NAME
    admin_surname = settings.ADMIN_SURNAME
    admin_password = settings.ADMIN_PASSWORD
    
    password_hash = get_password_hash(admin_password)
    print(f"DEBUG: Generated password hash for admin: {password_hash[:20]}...")
    
    # Check if admin user already exists by mobile_phone (new schema)
    existing_admin = await database.users.find_one({"mobile_phone": admin_mobile_phone})
    if existing_admin:
        print(f"DEBUG: Found existing admin, current password_hash: {existing_admin.get('password_hash', 'NOT FOUND')[:20] if existing_admin.get('password_hash') else 'NOT FOUND'}...")
    
    # If not found, check for admin by role (old schema migration)
    if not existing_admin:
        existing_admin = await database.users.find_one({"role": "admin"})
        if existing_admin:
            # Migrate old admin to new schema
            await database.users.update_one(
                {"_id": existing_admin["_id"]},
                {"$set": {
                    "mobile_phone": admin_mobile_phone,
                    "name": admin_name,
                    "surname": admin_surname,
                    "password_hash": password_hash,
                    "is_active": True,
                    "role": "admin"
                }, "$unset": {
                    "email": "",
                    "username": ""
                }}
            )
            print(f"Admin user migrated to new schema: {admin_mobile_phone}")
    
    admin_user = {
        "mobile_phone": admin_mobile_phone,
        "name": admin_name,
        "surname": admin_surname,
        "password_hash": password_hash,
        "is_active": True,
        "role": "admin"
    }
    
    if existing_admin:
        # Update existing admin to ensure it matches current schema and password
        result = await database.users.update_one(
            {"mobile_phone": admin_mobile_phone},
            {"$set": {
                "name": admin_name,
                "surname": admin_surname,
                "password_hash": password_hash,
                "is_active": True,
                "role": "admin"
            }}
        )
        print(f"Admin user updated: {admin_mobile_phone} (modified: {result.modified_count})")
        
        # Verify the password was stored correctly
        updated_admin = await database.users.find_one({"mobile_phone": admin_mobile_phone})
        if updated_admin:
            stored_hash = updated_admin.get("password_hash")
            if stored_hash and verify_password(admin_password, stored_hash):
                print(f"DEBUG: Password verification SUCCESS after update")
            else:
                print(f"DEBUG: Password verification FAILED after update!")
    else:
        # Create new admin user
        await database.users.insert_one(admin_user)
        print(f"Admin user created: {admin_mobile_phone}")
        
        # Verify the password was stored correctly
        new_admin = await database.users.find_one({"mobile_phone": admin_mobile_phone})
        if new_admin:
            stored_hash = new_admin.get("password_hash")
            if stored_hash and verify_password(admin_password, stored_hash):
                print(f"DEBUG: Password verification SUCCESS after creation")
            else:
                print(f"DEBUG: Password verification FAILED after creation!")
    
    print(f"Admin credentials - Mobile: {admin_mobile_phone}, Password: {admin_password}")
    
    # Seed sample exam data if none exists
    await seed_sample_data(database)


async def seed_sample_data(database):
    """Seed sample math exam and questions if the database is empty."""
    from datetime import datetime, timedelta
    
    exam_count = await database.exams.count_documents({})
    if exam_count > 0:
        return

    print("DEBUG: Seeding sample exam data...")
    
    # Create a math exam
    math_exam = {
        "title": "9th Grade Math Skills Evaluation",
        "subject": "math",
        "start_at": datetime.utcnow() - timedelta(days=1),
        "end_at": datetime.utcnow() + timedelta(days=30),
        "duration_minutes": 45,
        "is_active": True
    }
    
    result = await database.exams.insert_one(math_exam)
    exam_id = result.inserted_id
    
    # Create sample questions
    questions = [
        {
            "number": 1,
            "exam_id": exam_id,
            "statement": "What is 15 + 27?",
            "type": "MCQ",
            "answer": "b",
            "options": {"a": "32", "b": "42", "c": "41", "d": "52"}
        },
        {
            "number": 2,
            "exam_id": exam_id,
            "statement": "Solve for x: 3x - 5 = 10",
            "type": "MCQ",
            "answer": "c",
            "options": {"a": "2", "b": "3", "c": "5", "d": "15"}
        },
        {
            "number": 3,
            "exam_id": exam_id,
            "statement": "What is the square root of 144?",
            "type": "MCQ",
            "answer": "a",
            "options": {"a": "12", "b": "14", "c": "11", "d": "13"}
        }
    ]
    
    await database.questions.insert_many(questions)
    
    # Update exam to include question IDs
    question_ids = [q["_id"] for q in questions]
    await database.exams.update_one({"_id": exam_id}, {"$set": {"questions": question_ids}})
    
    print(f"DEBUG: Sample data seeded. Exam ID: {exam_id}")
