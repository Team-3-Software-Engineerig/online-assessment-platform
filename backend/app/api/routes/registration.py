from fastapi import APIRouter, HTTPException
from app.schemas.registration import RegistrationRequest, RegistrationResponse

router = APIRouter(prefix="/api", tags=["registration"])


@router.post("/register", response_model=RegistrationResponse, status_code=201)
async def register_student(registration: RegistrationRequest):
    """
    Register a new student for the assessment.
    """
    try:
        # For now, return a mock response with student data
        # TODO: Replace with actual database save when DB is set up
        student_data = {
            "id": 1,  # Mock ID - replace with actual DB-generated ID
            "firstName": registration.firstName,
            "lastName": registration.lastName,
            "mobilePhone": registration.mobilePhone,
            "message": "Registration successful"
        }
        
        return RegistrationResponse(**student_data)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Registration failed: {str(e)}"
        )
