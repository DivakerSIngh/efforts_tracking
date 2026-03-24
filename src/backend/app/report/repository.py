from app.core.database import execute_sp


def _normalize_report_row(row: dict) -> dict:
    """Map PascalCase SP result columns to snake_case to match the frontend model."""
    return {
        "candidate_id":   row["CandidateId"],
        "candidate_name": row["CandidateName"],
        "email":          row["Email"],
        "project_id":     row["ProjectId"],
        "project_name":   row["ProjectName"],
        "project_hours":  float(row["ProjectHours"]),
        "total_hours":    float(row["TotalHours"]),
        "hourly_rate":    float(row["HourlyRate"]),
        "fixed_amount":   float(row["FixedAmount"]),
        "total_amount":   float(row["TotalAmount"]),
    }


def get_candidate_monthly_report(candidate_id: int, month: int, year: int) -> list[dict]:
    return execute_sp("GetCandidateMonthlyReport", {
        "CandidateId": candidate_id,
        "Month": month,
        "Year": year,
    })


def get_all_candidates_report(month: int, year: int, candidate_id: int | None = None) -> list[dict]:
    params: dict = {"Month": month, "Year": year}
    if candidate_id is not None:
        params["CandidateId"] = candidate_id
    rows = execute_sp("GetAllCandidatesReport", params)
    return [_normalize_report_row(r) for r in rows]


def get_admin_project_report(month: int, year: int) -> list[dict]:
    return execute_sp("GetAdminProjectReport", {"Month": month, "Year": year})
