from pydantic import BaseModel
from typing import Optional
from datetime import date


class TimesheetEntryCreate(BaseModel):
    project_id: int
    entry_date: date
    hours: float
    remarks: Optional[str] = None


class TimesheetEntryResponse(BaseModel):
    entry_id: int
    project_id: int
    project_name: str
    entry_date: date
    hours: float
    remarks: Optional[str]


class TimesheetEntryUpdate(BaseModel):
    hours: float
    remarks: Optional[str] = None
