import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CandidateReportRow } from '../core/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private apiUrl = `${environment.apiUrl}/report`;

  constructor(private http: HttpClient) {}

  /** Unified endpoint — backend scopes by role automatically */
  getReport(month: number, year: number): Observable<CandidateReportRow[]> {
    return this.http.get<CandidateReportRow[]>(
      `${this.apiUrl}/summary?month=${month}&year=${year}`
    );
  }

  /** Keep for backwards compat / direct admin use */
  getAllCandidatesReport(month: number, year: number): Observable<CandidateReportRow[]> {
    return this.http.get<CandidateReportRow[]>(
      `${this.apiUrl}/admin/all-candidates?month=${month}&year=${year}`
    );
  }

  getCandidateSummary(month: number, year: number): Observable<CandidateReportRow[]> {
    return this.http.get<CandidateReportRow[]>(
      `${this.apiUrl}/candidate/summary?month=${month}&year=${year}`
    );
  }

  exportExcel(month: number, year: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/admin/all-candidates/export?month=${month}&year=${year}`,
      { responseType: 'blob' }
    );
  }
}
