import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardSummary, MonthlyTrend } from '../core/models';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  constructor(private http: HttpClient) {}

  getSummary(month: number, year: number): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`/api/dashboard/summary?month=${month}&year=${year}`);
  }

  getTrend(months = 6): Observable<MonthlyTrend[]> {
    return this.http.get<MonthlyTrend[]>(`/api/dashboard/trend?months=${months}`);
  }

  getYearlyTrend(year: number): Observable<MonthlyTrend[]> {
    return this.http.get<MonthlyTrend[]>(`/api/dashboard/yearly-trend?year=${year}`);
  }
}
