from pydantic import BaseModel, Field, validator


class RegistrationRequest(BaseModel):
    firstName: str = Field(..., min_length=2, max_length=100)
    lastName: str = Field(..., min_length=2, max_length=100)
    mobilePhone: str = Field(..., min_length=10, max_length=15)

    @validator('mobilePhone')
    def validate_phone(cls, v):
        # Remove all non-digit characters for validation
        digits_only = ''.join(filter(str.isdigit, v))
        if len(digits_only) < 10:
            raise ValueError('Mobile phone must contain at least 10 digits')
        return digits_only


class RegistrationResponse(BaseModel):
    id: int
    firstName: str
    lastName: str
    mobilePhone: str
    message: str = "Registration successful"
