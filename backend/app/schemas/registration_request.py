from datetime import datetime
from typing import Literal, Optional
from pydantic import AliasChoices, BaseModel, EmailStr, Field


class RegistrationRequestCreate(BaseModel):
    mobile_phone: str = Field(
        ...,
        validation_alias=AliasChoices("mobile_phone", "mobilePhone"),
        pattern=r"^\+?[0-9]{10,15}$",
    )
    name: str = Field(..., validation_alias=AliasChoices("name", "firstName"), min_length=2)
    surname: str = Field(..., validation_alias=AliasChoices("surname", "lastName"), min_length=2)
    school: str = Field(..., min_length=2)
    emergency_contact: str = Field(
        ...,
        validation_alias=AliasChoices("emergency_contact", "emergencyContact"),
        pattern=r"^\+?[0-9]{10,15}$",
    )
    role: Literal["student", "teacher", "manager"]
    subject: Optional[str] = Field(None, validation_alias=AliasChoices("subject", "teacherSubject"))
    email: Optional[EmailStr] = Field(None, validation_alias=AliasChoices("email"))


class RegistrationRequestResponse(BaseModel):
    id: str
    mobile_phone: str
    mobilePhone: str
    name: str
    surname: str
    firstName: str
    lastName: str
    school: Optional[str] = None
    emergency_contact: Optional[str] = None
    email: Optional[str] = None
    role: str
    subject: Optional[str] = None
    status: Literal["pending", "approved", "rejected"]
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    review_note: Optional[str] = None


class RegistrationRequestApprove(BaseModel):
    password: str = Field(..., min_length=6)


class RegistrationRequestReject(BaseModel):
    reason: Optional[str] = None
