import sys
sys.path.insert(0, r'd:\AI Assistant\EffortTracking\src\backend')
from app.timesheet.schemas import TimesheetEntryCreate, TimesheetEntryResponse
from app.timesheet import service
from datetime import date

data = TimesheetEntryCreate(project_id=2, entry_date=date(2026, 3, 22), hours=5)
result = service.insert_entry(3, data)
print('Raw types:', {k: type(v).__name__ for k, v in result.items()})
r = TimesheetEntryResponse(**result)
print('JSON OK:', r.model_dump_json())

# Test update
from app.timesheet.schemas import TimesheetEntryUpdate
upd = TimesheetEntryUpdate(hours=6, remarks='Updated test')
upd_result = service.update_entry(result['entry_id'], upd)
r2 = TimesheetEntryResponse(**upd_result)
print('UPDATE JSON:', r2.model_dump_json())
