import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardSummary, MonthlyTrend } from '../core/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getSummary(month: number, year: number): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/summary?month=${month}&year=${year}`);
  }

  getTrend(months = 6): Observable<MonthlyTrend[]> {
    return this.http.get<MonthlyTrend[]>(`${this.apiUrl}/trend?months=${months}`);
  }

  getYearlyTrend(year: number): Observable<MonthlyTrend[]> {
    return this.http.get<MonthlyTrend[]>(`${this.apiUrl}/yearly-trend?year=${year}`);
  }
}
