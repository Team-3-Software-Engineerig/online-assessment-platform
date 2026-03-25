from datetime import datetime
from fastapi import APIRouter, HTTPException, status

import app.db.db as db_module
from app.clients.user_client import find_user_by_mobile_phone
from app.schemas.registration_request import RegistrationRequestCreate, RegistrationRequestResponse
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import self_register_user
from app.core.security import create_access_token

router = APIRouter(prefix="/api/register", tags=["registration"])


def _db():
    if db_module.database is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    return db_module.database


@router.post("/request", response_model=RegistrationRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_registration_request(payload: RegistrationRequestCreate):
    """Public endpoint to request account creation by admin."""
    existing_user = await find_user_by_mobile_phone(payload.mobile_phone)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account already exists for this mobile number. Please use /login."
        )

    # Avoid duplicate pending requests for same mobile + role.
    duplicate = await _db().registration_requests.find_one({
        "mobile_phone": payload.mobile_phone,
        "role": payload.role,
        "status": "pending",
    })
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A pending request already exists. Please wait for admin review."
        )

    doc = {
        "mobile_phone": payload.mobile_phone,
        "name": payload.name,
        "surname": payload.surname,
        "school": payload.school,
        "emergency_contact": payload.emergency_contact,
        "role": payload.role,
        "subject": payload.subject,
        "email": payload.email,
        "status": "pending",
        "created_at": datetime.utcnow(),
        "reviewed_at": None,
        "review_note": None,
    }
    result = await _db().registration_requests.insert_one(doc)
    created = await _db().registration_requests.find_one({"_id": result.inserted_id})
    return RegistrationRequestResponse(
        id=str(created["_id"]),
        mobile_phone=created["mobile_phone"],
        mobilePhone=created["mobile_phone"],
        name=created["name"],
        surname=created["surname"],
        firstName=created["name"],
        lastName=created["surname"],
        school=created.get("school"),
        emergency_contact=created.get("emergency_contact"),
        email=created.get("email"),
        role=created["role"],
        subject=created.get("subject"),
        status=created["status"],
        created_at=created["created_at"],
        reviewed_at=created.get("reviewed_at"),
        review_note=created.get("review_note"),
    )


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
    if not user_data.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required."
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
