from fastapi import APIRouter, Depends
from app.candidate.schemas import CandidateCreate, CandidateUpdate, CandidateResponse
from app.candidate import service
from app.dependencies import require_admin

router = APIRouter()


@router.get("", response_model=list[CandidateResponse])
def list_candidates(_: dict = Depends(require_admin)):
    """Admin: list all candidates."""
    return service.get_all_candidates()


@router.post("", response_model=dict, status_code=201)
def create_candidate(data: CandidateCreate, _: dict = Depends(require_admin)):
    """Admin: create a new candidate (calls CreateUser SP)."""
    return service.create_candidate(data)


@router.put("/{user_id}", response_model=dict)
def update_candidate(user_id: int, data: CandidateUpdate, _: dict = Depends(require_admin)):
    """Admin: update candidate profile fields."""
    return service.update_candidate(user_id, data)


@router.patch("/{user_id}/status")
def set_status(user_id: int, is_active: bool, _: dict = Depends(require_admin)):
    """Admin: activate or deactivate a candidate."""
    service.set_candidate_status(user_id, is_active)
    return {"detail": "Status updated"}


@router.get("/{user_id}/timesheet")
def get_candidate_timesheet(
    user_id: int, month: int, year: int,
    _: dict = Depends(require_admin)
):
    """Admin: view a candidate's monthly timesheet (read-only)."""
    return service.get_candidate_timesheet(user_id, month, year)


@router.get("/{user_id}/projects")
def get_candidate_projects(user_id: int, _: dict = Depends(require_admin)):
    """Admin: get projects assigned to a candidate."""
    return service.get_candidate_projects(user_id)
