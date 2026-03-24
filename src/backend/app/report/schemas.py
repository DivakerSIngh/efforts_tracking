from pydantic import BaseModel
from typing import Optional


class CandidateSummaryReport(BaseModel):
    candidate_name: str
    total_hours: float
    total_amount: float
    fixed_amount: Optional[float]


class ProjectBreakdown(BaseModel):
    project_name: str
    hours: float
