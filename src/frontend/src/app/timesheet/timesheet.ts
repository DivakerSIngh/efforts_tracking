import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project, TimesheetEntry, TimesheetEntryCreate, TimesheetEntryUpdate } from '../core/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TimesheetService {
  private apiUrl = `${environment.apiUrl}/timesheet`;

  constructor(private http: HttpClient) {}

  getAssignedProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/projects`);
  }

  getTimesheet(month: number, year: number): Observable<TimesheetEntry[]> {
    return this.http.get<TimesheetEntry[]>(`${this.apiUrl}?month=${month}&year=${year}`);
  }

  addEntry(entry: TimesheetEntryCreate): Observable<TimesheetEntry> {
    return this.http.post<TimesheetEntry>(`${this.apiUrl}`, entry);
  }

  updateEntry(entryId: number, data: TimesheetEntryUpdate): Observable<TimesheetEntry> {
    return this.http.put<TimesheetEntry>(`${this.apiUrl}/${entryId}`, data);
  }

  deleteEntry(entryId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${entryId}`);
  }
}
