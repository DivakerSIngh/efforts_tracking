from app.dashboard import repository


def get_dashboard_summary(candidate_id: int, month: int, year: int) -> dict:
    rows = repository.get_candidate_monthly_report(candidate_id, month, year)
    if not rows:
        return {
            "candidate_id": candidate_id,
            "full_name": "",
            "month": month,
            "year": year,
            "total_hours": 0.0,
            "hourly_rate": 0.0,
            "fixed_amount": 0.0,
            "total_payment": 0.0,
            "project_breakdown": [],
        }
    first = rows[0]
    return {
        "candidate_id": first["CandidateId"],
        "full_name": first["FullName"],
        "month": first["Month"],
        "year": first["Year"],
        "total_hours": float(first["TotalHours"]),
        "hourly_rate": float(first["HourlyRate"]),
        "fixed_amount": float(first["FixedAmount"]),
        "total_payment": float(first["TotalPayment"]),
        "project_breakdown": [
            {
                "project_id": r["ProjectId"],
                "project_name": r["ProjectName"],
                "hours": float(r["ProjectHours"]),
            }
            for r in rows
        ],
    }


def get_monthly_trend(candidate_id: int, months: int = 6) -> list[dict]:
    rows = repository.get_candidate_monthly_trend(candidate_id, months)
    return [
        {"year": r["Year"], "month": r["Month"], "total_hours": float(r["TotalHours"])}
        for r in rows
    ]


def get_yearly_trend(candidate_id: int, year: int) -> list[dict]:
    rows = repository.get_candidate_yearly_trend(candidate_id, year)
    return [
        {"year": r["Year"], "month": r["Month"], "total_hours": float(r["TotalHours"])}
        for r in rows
    ]
