from fastapi import APIRouter, Depends, Query
from app.dependencies import get_current_user
from app.dashboard import service

router = APIRouter()


@router.get("/summary")
def get_summary(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020),
    current_user: dict = Depends(get_current_user),
):
    """Candidate: get monthly billing summary and project breakdown."""
    return service.get_dashboard_summary(current_user["user_id"], month, year)


@router.get("/trend")
def get_trend(
    months: int = Query(6, ge=1, le=24),
    current_user: dict = Depends(get_current_user),
):
    """Candidate: get monthly hours trend for the last N months."""
    return service.get_monthly_trend(current_user["user_id"], months)
