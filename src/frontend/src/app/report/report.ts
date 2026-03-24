import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CandidateReportRow } from '../core/models';

@Injectable({ providedIn: 'root' })
export class ReportService {

  constructor(private http: HttpClient) {}

  /** Unified endpoint — backend scopes by role automatically */
  getReport(month: number, year: number): Observable<CandidateReportRow[]> {
    return this.http.get<CandidateReportRow[]>(
      `/api/report/summary?month=${month}&year=${year}`
    );
  }

  /** Keep for backwards compat / direct admin use */
  getAllCandidatesReport(month: number, year: number): Observable<CandidateReportRow[]> {
    return this.http.get<CandidateReportRow[]>(
      `/api/report/admin/all-candidates?month=${month}&year=${year}`
    );
  }

  getCandidateSummary(month: number, year: number): Observable<CandidateReportRow[]> {
    return this.http.get<CandidateReportRow[]>(
      `/api/report/candidate/summary?month=${month}&year=${year}`
    );
  }

  exportExcel(month: number, year: number): Observable<Blob> {
    return this.http.get(
      `/api/report/admin/all-candidates/export?month=${month}&year=${year}`,
      { responseType: 'blob' }
    );
  }
}
