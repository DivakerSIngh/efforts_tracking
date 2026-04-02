from app.core.database import execute_sp
from app.core.crypto import encrypt_decimal, decrypt_decimal


def _decrypt_row(row: dict) -> dict:
    """Decrypt encrypted financial fields returned from any candidate SP."""
    if not row:
        return row
    row = dict(row)
    # Handle both PascalCase (SP return) and snake_case (some SPs use aliases)
    for pascal, snake in (("HourlyRate", "hourly_rate"), ("FixedAmount", "fixed_amount")):
        if pascal in row:
            row[pascal] = decrypt_decimal(row[pascal])
        if snake in row:
            row[snake] = decrypt_decimal(row[snake])
    return row


def create_candidate(data: dict) -> dict:
    params = {
        "Email": data["email"],
        "PasswordHash": data["password_hash"],
        "FullName": data["full_name"],
        "Role": data["role"],
        "Phone": data.get("phone"),
        "HourlyRate": encrypt_decimal(data.get("hourly_rate", 0)),
        "FixedAmount": encrypt_decimal(data.get("fixed_amount", 0)),
        "AccountNo": data.get("account_no"),
        "IFSCCode": data.get("ifsc_code"),
    }
    results = execute_sp("CreateUser", params)
    return _decrypt_row(results[0]) if results else {}


def get_all_candidates() -> list[dict]:
    rows = execute_sp("GetAllCandidates")
    return [_decrypt_row(r) for r in rows]


def update_candidate(user_id: int, data: dict) -> dict:
    params = {
        "UserId": user_id,
        "HourlyRate": encrypt_decimal(data["hourly_rate"]) if data.get("hourly_rate") is not None else None,
        "FixedAmount": encrypt_decimal(data["fixed_amount"]) if data.get("fixed_amount") is not None else None,
        "Phone": data.get("phone"),
        "AccountNo": data.get("account_no"),
        "IFSCCode": data.get("ifsc_code"),
    }
    results = execute_sp("UpdateCandidateRates", params)
    return _decrypt_row(results[0]) if results else {}


def set_candidate_status(user_id: int, is_active: bool) -> None:
    execute_sp("SetCandidateStatus", {"UserId": user_id, "IsActive": int(is_active)})
