from fastapi import HTTPException, status
from app.timesheet import repository
from app.timesheet.schemas import TimesheetEntryCreate, TimesheetEntryUpdate


def get_timesheet(candidate_id: int, month: int, year: int) -> list[dict]:
    return repository.get_timesheet_by_month(candidate_id, month, year)


def insert_entry(candidate_id: int, data: TimesheetEntryCreate) -> dict:
    payload = data.model_dump()
    payload["entry_date"] = str(payload["entry_date"])
    return repository.insert_entry(candidate_id, payload)


def update_entry(entry_id: int, data: TimesheetEntryUpdate) -> dict:
    return repository.update_entry(entry_id, data.model_dump())


def delete_entry(entry_id: int) -> None:
    repository.delete_entry(entry_id)


def get_assigned_projects(candidate_id: int) -> list[dict]:
    return repository.get_assigned_projects(candidate_id)
