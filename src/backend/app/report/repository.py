from collections import defaultdict
from app.core.database import execute_sp
from app.core.crypto import decrypt_decimal


def _normalize_report_row(row: dict) -> dict:
    """Map PascalCase SP result columns to snake_case and decrypt financial fields."""
    hourly_rate = decrypt_decimal(row["HourlyRate"])
    fixed_amount = decrypt_decimal(row["FixedAmount"])
    total_hours = float(row["TotalHours"])
    return {
        "candidate_id":   row["CandidateId"],
        "candidate_name": row["CandidateName"],
        "email":          row["Email"],
        "project_id":     row["ProjectId"],
        "project_name":   row["ProjectName"],
        "project_hours":  float(row["ProjectHours"]),
        "total_hours":    total_hours,
        "hourly_rate":    hourly_rate,
        "fixed_amount":   fixed_amount,
        "total_amount":   round(total_hours * hourly_rate + fixed_amount, 2),
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
    """Aggregate project-level report in Python after decrypting candidate rates."""
    all_rows = get_all_candidates_report(month, year)

    project_map: dict[int, dict] = {}
    # Per-candidate billing totals (same value repeated across all project rows for a candidate)
    candidate_info: dict[int, dict] = {}
    candidate_projects: dict[int, set] = defaultdict(set)

    for row in all_rows:
        pid = row["project_id"]
        cid = row["candidate_id"]

        if pid not in project_map:
            project_map[pid] = {
                "project_id":    pid,
                "project_name":  row["project_name"],
                "total_hours":   0.0,
                "candidate_ids": set(),
            }
        project_map[pid]["total_hours"] += row["project_hours"]
        project_map[pid]["candidate_ids"].add(cid)

        if cid not in candidate_info:
            candidate_info[cid] = {
                "total_hours":  row["total_hours"],
                "hourly_rate":  row["hourly_rate"],
                "fixed_amount": row["fixed_amount"],
            }
        candidate_projects[cid].add(pid)

    result = []
    for pid, pdata in project_map.items():
        cand_amount = sum(
            info["total_hours"] * info["hourly_rate"] + info["fixed_amount"]
            for cid, info in candidate_info.items()
            if pid in candidate_projects[cid]
        )
        result.append({
            "project_id":        pid,
            "project_name":      pdata["project_name"],
            "total_candidates":  len(pdata["candidate_ids"]),
            "total_hours":       round(pdata["total_hours"], 2),
            "candidate_amount":  round(cand_amount, 2),
            "project_amount":    round(cand_amount, 2),
        })

    return sorted(result, key=lambda r: r["project_name"])
