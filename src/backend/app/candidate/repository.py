from app.core.database import execute_sp


def create_candidate(data: dict) -> dict:
    params = {
        "Email": data["email"],
        "PasswordHash": data["password_hash"],
        "FullName": data["full_name"],
        "Role": data["role"],
        "Phone": data.get("phone"),
        "HourlyRate": data.get("hourly_rate", 0),
        "FixedAmount": data.get("fixed_amount", 0),
        "AccountNo": data.get("account_no"),
        "IFSCCode": data.get("ifsc_code"),
    }
    results = execute_sp("CreateUser", params)
    return results[0] if results else {}


def get_all_candidates() -> list[dict]:
    return execute_sp("GetAllCandidates")


def update_candidate(user_id: int, data: dict) -> dict:
    params = {
        "UserId": user_id,
        "HourlyRate": data.get("hourly_rate"),
        "FixedAmount": data.get("fixed_amount"),
        "Phone": data.get("phone"),
        "AccountNo": data.get("account_no"),
        "IFSCCode": data.get("ifsc_code"),
    }
    results = execute_sp("UpdateCandidateRates", params)
    return results[0] if results else {}


def set_candidate_status(user_id: int, is_active: bool) -> None:
    execute_sp("SetCandidateStatus", {"UserId": user_id, "IsActive": int(is_active)})
