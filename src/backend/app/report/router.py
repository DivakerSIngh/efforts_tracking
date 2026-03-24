from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.report import service
from app.dependencies import get_current_user, require_admin

router = APIRouter()


@router.get("/summary")
def report_summary(month: int, year: int, current_user: dict = Depends(get_current_user)):
    """
    Unified report endpoint.
    - Admin: returns all candidates' data.
    - Candidate: returns only their own data.
    Uses the same GetAllCandidatesReport SP with an optional CandidateId filter.
    """
    if current_user["role"] == "admin":
        return service.get_all_candidates_report(month, year)
    return service.get_candidate_summary(current_user["user_id"], month, year)


@router.get("/candidate/summary")
def candidate_summary(month: int, year: int, current_user: dict = Depends(get_current_user)):
    """Candidate: monthly earnings and hours summary (own data only)."""
    return service.get_candidate_summary(current_user["user_id"], month, year)


@router.get("/admin/all-candidates")
def all_candidates_report(month: int, year: int, _: dict = Depends(require_admin)):
    """Admin: all candidates report for a given month."""
    return service.get_all_candidates_report(month, year)


@router.get("/admin/all-candidates/export")
def export_report(month: int, year: int, _: dict = Depends(require_admin)):
    """Admin: download all candidates report as Excel."""
    buffer = service.export_all_candidates_report_excel(month, year)
    filename = f"candidates_report_{year}_{month:02d}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
