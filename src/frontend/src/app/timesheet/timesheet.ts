import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Project, TimesheetEntry, TimesheetEntryCreate, TimesheetEntryUpdate } from '../core/models';
import { FirebaseTimesheetService } from '../core/firebase-timesheet.service';

@Injectable({ providedIn: 'root' })
export class TimesheetService {
  constructor(private firebaseTimesheetService: FirebaseTimesheetService) {}

  getAssignedProjects(): Observable<Project[]> {
    return this.firebaseTimesheetService.getAssignedProjects();
  }

  getTimesheet(month: number, year: number): Observable<TimesheetEntry[]> {
    return this.firebaseTimesheetService.getTimesheet(month, year);
  }

  addEntry(entry: TimesheetEntryCreate): Observable<TimesheetEntry> {
    return this.firebaseTimesheetService.addEntry(entry);
  }

  updateEntry(entryId: number, data: TimesheetEntryUpdate): Observable<TimesheetEntry> {
    return this.firebaseTimesheetService.updateEntry(entryId, data);
  }

  deleteEntry(entryId: number): Observable<void> {
    return this.firebaseTimesheetService.deleteEntry(entryId);
  }
}
