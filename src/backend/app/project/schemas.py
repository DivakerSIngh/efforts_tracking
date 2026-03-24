from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProjectCreate(BaseModel):
    name: str
    client_name: Optional[str] = None
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    client_name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ProjectResponse(BaseModel):
    project_id: int
    name: str
    client_name: Optional[str] = None
    description: Optional[str] = None
    is_active: bool
    created_date: datetime
    candidate_count: int = 0


class AssignProjectRequest(BaseModel):
    candidate_id: int
    project_id: int
