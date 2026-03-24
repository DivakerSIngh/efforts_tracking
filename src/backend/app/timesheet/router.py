from fastapi import APIRouter, Depends, HTTPException
from app.timesheet.schemas import TimesheetEntryCreate, TimesheetEntryResponse, TimesheetEntryUpdate
from app.timesheet import service
from app.dependencies import get_current_user

router = APIRouter()


@router.get("/projects")
def get_assigned_projects(current_user: dict = Depends(get_current_user)):
    """Candidate: get projects assigned to the current user."""
    return service.get_assigned_projects(current_user["user_id"])


@router.get("", response_model=list[TimesheetEntryResponse])
def get_timesheet(month: int, year: int, current_user: dict = Depends(get_current_user)):
    """Candidate: fetch monthly timesheet entries."""
    return service.get_timesheet(current_user["user_id"], month, year)


@router.post("", response_model=TimesheetEntryResponse, status_code=201)
def submit_entry(data: TimesheetEntryCreate, current_user: dict = Depends(get_current_user)):
    """Candidate: submit a timesheet entry."""
    return service.insert_entry(current_user["user_id"], data)


@router.put("/{entry_id}", response_model=TimesheetEntryResponse)
def update_entry(entry_id: int, data: TimesheetEntryUpdate, current_user: dict = Depends(get_current_user)):
    """Candidate: update hours/remarks for an existing entry."""
    result = service.update_entry(entry_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Entry not found")
    return result


@router.delete("/{entry_id}", status_code=204)
def delete_entry(entry_id: int, current_user: dict = Depends(get_current_user)):
    """Candidate: delete a timesheet entry (current month only)."""
    service.delete_entry(entry_id)
