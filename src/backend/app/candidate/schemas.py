from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class CandidateCreate(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    hourly_rate: Optional[float] = None
    fixed_amount: Optional[float] = None
    password: str
    account_no: Optional[str] = None
    ifsc_code: Optional[str] = None


class CandidateUpdate(BaseModel):
    hourly_rate: Optional[float] = None
    fixed_amount: Optional[float] = None
    phone: Optional[str] = None
    account_no: Optional[str] = None
    ifsc_code: Optional[str] = None


class CandidateResponse(BaseModel):
    user_id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    hourly_rate: Optional[float] = None
    fixed_amount: Optional[float] = None
    account_no: Optional[str] = None
    ifsc_code: Optional[str] = None
    is_active: bool
    created_date: datetime
