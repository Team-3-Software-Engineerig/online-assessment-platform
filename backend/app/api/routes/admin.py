from fastapi import APIRouter, HTTPException, status, Depends
from app.api.routes.auth import get_current_user
from app.api.deps import require_admin
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import create_user_with_role


router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/create", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new user (admin only).
    
    Creates:
    - User in users collection
    - Student document if role is "student"
    - Teacher document if role is "teacher"
    - Admin user if role is "admin" (no separate document needed)
    """
    # Verify current user is admin
    user_id = str(current_user["_id"])
    try:
        await require_admin(user_id)
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin authorization required"
        )
    
    try:
        result = await create_user_with_role(
            mobile_phone=user_data.mobile_phone,
            name=user_data.name,
            surname=user_data.surname,
            password=user_data.password,
            role=user_data.role
        )
        return UserResponse(**result)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(exc)}"
        )
