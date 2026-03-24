import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project, TimesheetEntry, TimesheetEntryCreate, TimesheetEntryUpdate } from '../core/models';

@Injectable({ providedIn: 'root' })
export class TimesheetService {

  constructor(private http: HttpClient) {}

  getAssignedProjects(): Observable<Project[]> {
    return this.http.get<Project[]>('/api/timesheet/projects');
  }

  getTimesheet(month: number, year: number): Observable<TimesheetEntry[]> {
    return this.http.get<TimesheetEntry[]>(`/api/timesheet?month=${month}&year=${year}`);
  }

  addEntry(entry: TimesheetEntryCreate): Observable<TimesheetEntry> {
    return this.http.post<TimesheetEntry>('/api/timesheet', entry);
  }

  updateEntry(entryId: number, data: TimesheetEntryUpdate): Observable<TimesheetEntry> {
    return this.http.put<TimesheetEntry>(`/api/timesheet/${entryId}`, data);
  }

  deleteEntry(entryId: number): Observable<void> {
    return this.http.delete<void>(`/api/timesheet/${entryId}`);
  }
}
