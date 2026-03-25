from app.candidate import repository
from app.candidate.schemas import CandidateCreate, CandidateUpdate
from app.core.security import hash_password
from app.core.email import send_credentials_email
from app.core.database import execute_sp


def create_candidate(data: CandidateCreate) -> dict:
    plain_password = data.password
    payload = data.model_dump()
    payload["password_hash"] = hash_password(payload.pop("password"))
    payload["role"] = "candidate"
    result = repository.create_candidate(payload)
    send_credentials_email(data.email, data.full_name, plain_password)
    return result


def get_all_candidates() -> list[dict]:
    return repository.get_all_candidates()



def update_candidate(user_id: int, data: CandidateUpdate) -> dict:
    return repository.update_candidate(user_id, data.model_dump(exclude_none=False))

def get_candidate_profile(user_id: int) -> dict:
    # Reuse get_all_candidates and filter, or add a direct DB call if needed
    all_candidates = repository.get_all_candidates()
    for c in all_candidates:
        if c.get("user_id") == user_id:
            return c
    return {}


def set_candidate_status(user_id: int, is_active: bool) -> None:
    repository.set_candidate_status(user_id, is_active)


def get_candidate_timesheet(candidate_id: int, month: int, year: int) -> list[dict]:
    rows = execute_sp("GetTimesheetByMonth", {
        "CandidateId": candidate_id,
        "Month": month,
        "Year": year,
    })
    return [{
        "entry_id":    r["EntryId"],
        "project_id":  r["ProjectId"],
        "project_name": r["ProjectName"],
        "entry_date":  str(r["EntryDate"]),
        "hours":       float(r["Hours"]),
        "remarks":     r["Remarks"],
    } for r in rows]


def get_candidate_projects(candidate_id: int) -> list[dict]:
    return execute_sp("GetAssignedProjects", {"CandidateId": candidate_id})
