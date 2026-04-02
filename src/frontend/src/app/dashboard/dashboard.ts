import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardSummary, MonthlyTrend } from '../core/models';
import { FirebaseDashboardService } from '../core/firebase-dashboard.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private firebaseDashboardService: FirebaseDashboardService) {}

  getSummary(month: number, year: number): Observable<DashboardSummary> {
    return this.firebaseDashboardService.getSummary(month, year);
  }

  getTrend(months = 6): Observable<MonthlyTrend[]> {
    return this.firebaseDashboardService.getTrend(months);
  }

  getYearlyTrend(year: number): Observable<MonthlyTrend[]> {
    return this.firebaseDashboardService.getYearlyTrend(year);
  }
}
