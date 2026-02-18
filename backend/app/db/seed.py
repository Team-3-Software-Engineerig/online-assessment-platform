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
    
    # Debug: List all users to verify what's in the database
    all_users = await database.users.find({}).to_list(length=10)
    print(f"DEBUG: Total users in database: {len(all_users)}")
    for u in all_users:
        print(f"DEBUG: User - mobile_phone: '{u.get('mobile_phone')}', role: {u.get('role')}, id: {u.get('_id')}")
