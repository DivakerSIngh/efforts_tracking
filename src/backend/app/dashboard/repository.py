from app.core.database import execute_sp


def get_candidate_monthly_report(candidate_id: int, month: int, year: int) -> list[dict]:
    return execute_sp("GetCandidateMonthlyReport", {
        "CandidateId": candidate_id,
        "Month": month,
        "Year": year,
    })


def get_candidate_monthly_trend(candidate_id: int, months: int = 6) -> list[dict]:
    return execute_sp("GetCandidateMonthlyTrend", {
        "CandidateId": candidate_id,
        "Months": months,
    })


def get_candidate_yearly_trend(candidate_id: int, year: int) -> list[dict]:
    """Get all 12 months of a specific year for candidate."""
    results = []
    for month in range(1, 13):
        rows = execute_sp("GetCandidateMonthlyReport", {
            "CandidateId": candidate_id,
            "Month": month,
            "Year": year,
        })
        if rows:
            total_hours = float(rows[0]["TotalHours"]) if rows[0]["TotalHours"] else 0.0
        else:
            total_hours = 0.0
        results.append({
            "Year": year,
            "Month": month,
            "TotalHours": total_hours,
        })
    return results
