import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CandidateReportRow } from '../core/models';
import { FirebaseReportService } from '../core/firebase-report.service';

@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor(private firebaseReportService: FirebaseReportService) {}

  /** Unified endpoint — scopes by role automatically */
  getReport(month: number, year: number): Observable<CandidateReportRow[]> {
    return this.firebaseReportService.getReport(month, year);
  }

  /** Get all candidates report (admin only) */
  getAllCandidatesReport(month: number, year: number): Observable<CandidateReportRow[]> {
    return this.firebaseReportService.getAllCandidatesReport(month, year);
  }

  getCandidateSummary(month: number, year: number): Observable<CandidateReportRow[]> {
    return this.firebaseReportService.getCandidateSummary(month, year);
  }

  exportExcel(month: number, year: number): Observable<Blob> {
    return this.firebaseReportService.exportExcel(month, year);
  }
}
