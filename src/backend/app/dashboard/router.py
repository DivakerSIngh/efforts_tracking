from fastapi import APIRouter, Depends, Query
from app.dependencies import get_current_user
from app.dashboard import service
from app.report import service as report_service

router = APIRouter()


@router.get("/summary")
def get_summary(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020),
    current_user: dict = Depends(get_current_user),
):
    """
    Unified dashboard endpoint.
    - Admin: returns project-wise report (all projects and candidates).
    - Candidate: returns their own monthly billing summary and project breakdown.
    """
    if current_user["role"] == "admin":
        return report_service.get_admin_project_report(month, year)
    return service.get_dashboard_summary(current_user["user_id"], month, year)


@router.get("/trend")
def get_trend(
    months: int = Query(6, ge=1, le=24),
    current_user: dict = Depends(get_current_user),
):
    """Candidate: get monthly hours trend for the last N months."""
    return service.get_monthly_trend(current_user["user_id"], months)


@router.get("/yearly-trend")
def get_yearly_trend(
    year: int = Query(..., ge=2020),
    current_user: dict = Depends(get_current_user),
):
    """Candidate: get all months trend for a specific year."""
    return service.get_yearly_trend(current_user["user_id"], year)
