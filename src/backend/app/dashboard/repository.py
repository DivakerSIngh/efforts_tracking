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
