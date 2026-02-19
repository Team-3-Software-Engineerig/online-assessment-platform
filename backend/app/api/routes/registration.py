from fastapi import APIRouter, HTTPException, status
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import create_user_with_role
from app.core.security import create_access_token

router = APIRouter(prefix="/api/register", tags=["registration"])

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user_endpoint(user_data: UserCreate):
    """
    Public registration endpoint for all user roles.
    In a real system, teacher/admin registration might be restricted,
    but for this project prototype, we allow self-registration as requested in the UI.
    """
    try:
        # Map frontend 'firstName' and 'lastName' to 'name' and 'surname' if needed,
        # but UserCreate schema already uses 'name' and 'surname'.
        # The frontend sends 'firstName' and 'lastName' in RegisterStudent/etc.
        # Let's check the schema again.
        
        result = await create_user_with_role(
            mobile_phone=user_data.mobile_phone,
            name=user_data.name,
            surname=user_data.surname,
            password=user_data.password,
            role=user_data.role
        )
        
        # Generate token for auto-login
        access_token = create_access_token(data={"user_id": result["id"]})
        result["access_token"] = access_token
        
        return result
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during registration: {str(exc)}"
        )
