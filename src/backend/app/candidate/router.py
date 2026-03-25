
from fastapi import APIRouter, Depends
from app.candidate.schemas import CandidateCreate, CandidateUpdate, CandidateResponse
from app.candidate import service
from app.dependencies import require_admin, get_current_user


router = APIRouter()

# Candidate self-profile endpoints
@router.get("/me", response_model=CandidateResponse)
def get_my_profile(current_user: dict = Depends(get_current_user)):
    """Candidate: get own profile."""
    return service.get_candidate_profile(current_user["user_id"])

@router.put("/me", response_model=CandidateResponse)
def update_my_profile(data: CandidateUpdate, current_user: dict = Depends(get_current_user)):
    """Candidate: update own profile."""
    return service.update_candidate(current_user["user_id"], data)


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
