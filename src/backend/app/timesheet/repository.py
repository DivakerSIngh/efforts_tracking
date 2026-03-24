from app.core.database import execute_sp


def _row_to_entry(row: dict) -> dict:
    """Map PascalCase SP result columns to snake_case to match TimesheetEntryResponse."""
    return {
        "entry_id":    row["EntryId"],
        "project_id":  row["ProjectId"],
        "project_name": row["ProjectName"],
        "entry_date":  str(row["EntryDate"]),   # ensure JSON-safe string
        "hours":       float(row["Hours"]),      # convert Decimal → float
        "remarks":     row["Remarks"],
    }


def get_timesheet_by_month(candidate_id: int, month: int, year: int) -> list[dict]:
    rows = execute_sp("GetTimesheetByMonth", {
        "CandidateId": candidate_id,
        "Month": month,
        "Year": year,
    })
    return [_row_to_entry(r) for r in rows]


def insert_entry(candidate_id: int, data: dict) -> dict:
    # Use PascalCase parameter names to match the SP signature exactly.
    params = {
        "CandidateId": candidate_id,
        "ProjectId": data["project_id"],
        "EntryDate": data["entry_date"],
        "Hours": data["hours"],
        "Remarks": data.get("remarks"),
    }
    results = execute_sp("InsertTimesheetEntry", params)
    return _row_to_entry(results[0]) if results else {}


def update_entry(entry_id: int, data: dict) -> dict:
    results = execute_sp("UpdateTimesheetEntry", {
        "EntryId": entry_id,
        "Hours": data["hours"],
        "Remarks": data.get("remarks"),
    })
    return _row_to_entry(results[0]) if results else {}


def delete_entry(entry_id: int) -> None:
    execute_sp("DeleteTimesheetEntry", {"EntryId": entry_id})


def get_assigned_projects(candidate_id: int) -> list[dict]:
    return execute_sp("GetAssignedProjects", {"CandidateId": candidate_id})
