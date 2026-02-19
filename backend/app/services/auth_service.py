from app.clients.user_client import find_user_by_mobile_phone, is_user_admin
from app.core.security import verify_password, create_access_token


async def authenticate_user(mobile_phone: str, password: str) -> dict:
    """
    Authenticate user and return token data.
    Only allows admin and teacher roles.
    
    Args:
        mobile_phone: User mobile phone
        password: User password
    
    Returns:
        dict with access_token and token_type
    
    Raises:
        ValueError: If authentication fails or user is student
    """
    # Find user by mobile phone
    user = await find_user_by_mobile_phone(mobile_phone)
    if not user:
        raise ValueError("Incorrect mobile phone or password")
    
    # Verify password
    password_hash = user.get("password_hash")
    if not password_hash:
        raise ValueError("Incorrect mobile phone or password")
    
    if not verify_password(password, password_hash):
        raise ValueError("Incorrect mobile phone or password")
    
    # Check if user is active
    if not user.get("is_active", True):
        raise ValueError("Inactive user")
    
    # Only allow admin, teacher, and manager to login
    user_role = user.get("role", "student")
    if user_role not in ["admin", "teacher", "manager"]:
        raise ValueError("Students cannot login with password. Please register or follow session link.")
    
    # Create access token
    user_id = str(user["_id"])
    access_token = create_access_token(data={"user_id": user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user_id,
        "role": user_role,
        "name": user.get("name", ""),
        "surname": user.get("surname", "")
    }
