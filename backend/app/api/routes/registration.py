from fastapi import APIRouter, HTTPException, status
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import self_register_user
from app.core.security import create_access_token

router = APIRouter(prefix="/api/register", tags=["registration"])


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user_endpoint(user_data: UserCreate):
    """
    Public self-registration endpoint.
    Only students and teachers who have been PRE-ASSIGNED by a manager
    are allowed to register here. Their mobile phone must already exist in the
    system (added by a manager) for registration to succeed.
    """
    if user_data.role not in ["student", "teacher", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students, teachers, and managers can use self-registration."
        )

    try:
        result = await self_register_user(
            mobile_phone=user_data.mobile_phone,
            name=user_data.name,
            surname=user_data.surname,
            password=user_data.password,
            role=user_data.role,
            subject=user_data.subject
        )

        # Generate token for auto-login
        access_token = create_access_token(data={"user_id": result["id"]})
        result["access_token"] = access_token

        return result
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during registration: {str(exc)}"
        )
