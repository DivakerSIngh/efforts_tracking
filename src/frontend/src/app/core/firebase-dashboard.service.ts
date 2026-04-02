import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  where,
  getDocs,
  query
} from 'firebase/firestore';
import { Observable, from, map, switchMap } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { FirebaseAuthService } from './firebase-auth.service';
import { DashboardSummary, MonthlyTrend, ProjectBreakdown } from './models';

@Injectable({
  providedIn: 'root'
})
export class FirebaseDashboardService {
  private firestore: Firestore;

  constructor(
    private firebaseService: FirebaseService,
    private authService: FirebaseAuthService
  ) {
    this.firestore = firebaseService.firestore;
  }

  /**
   * Get dashboard summary for candidate
   */
  getSummary(month: number, year: number): Observable<DashboardSummary> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return from(Promise.resolve({
        candidate_id: 0,
        full_name: '',
        month,
        year,
        total_hours: 0,
        hourly_rate: 0,
        fixed_amount: 0,
        total_payment: 0,
        project_breakdown: []
      }));
    }

    return from(
      Promise.all([
        getDocs(
          query(
            collection(this.firestore, 'timesheets'),
            where('candidate_id', '==', currentUser.user_id)
          )
        ),
        getDocs(collection(this.firestore, 'candidates')),
        getDocs(collection(this.firestore, 'projects'))
      ])
    ).pipe(
      map(([timesheetSnapshot, candidateSnapshot, projectSnapshot]) => {
        // Filter timesheets by month/year
        const filteredTimesheets = timesheetSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(doc => {
            const entryDate = new Date((doc as any).entry_date);
            return (
              entryDate.getMonth() === month - 1 &&
              entryDate.getFullYear() === year
            );
          });

        // Get candidate rates
        const candidateData = candidateSnapshot.docs
          .find(doc => (doc.data() as any).user_id === currentUser.user_id)?.data() as any;

        const hourlyRate = candidateData?.hourly_rate || 0;
        const fixedAmount = candidateData?.fixed_amount || 0;

        // Create projects map
        const projectsMap = new Map();
        projectSnapshot.docs.forEach(doc => {
          const data = doc.data() as any;
          projectsMap.set(data.project_id, data);
        });

        // Calculate totals and project breakdown
        let totalHours = 0;
        const projectBreakdown: ProjectBreakdown[] = [];
        const projectMap = new Map<number, { hours: number; name: string }>();

        filteredTimesheets.forEach(timesheet => {
          const data = timesheet as any;
          totalHours += data.hours;

          if (!projectMap.has(data.project_id)) {
            projectMap.set(data.project_id, {
              hours: 0,
              name: projectsMap.get(data.project_id)?.name || 'Unknown'
            });
          }
          projectMap.get(data.project_id)!.hours += data.hours;
        });

        projectMap.forEach((value, projectId) => {
          projectBreakdown.push({
            project_id: projectId,
            project_name: value.name,
            hours: value.hours
          });
        });

        const totalPayment = totalHours * hourlyRate + fixedAmount;

        return {
          candidate_id: currentUser.user_id,
          full_name: currentUser.full_name,
          month,
          year,
          total_hours: totalHours,
          hourly_rate: hourlyRate,
          fixed_amount: fixedAmount,
          total_payment: totalPayment,
          project_breakdown: projectBreakdown
        };
      })
    );
  }

  /**
   * Get monthly trend data
   */
  getTrend(months: number = 6): Observable<MonthlyTrend[]> {
    return from(
      getDocs(collection(this.firestore, 'timesheets'))
    ).pipe(
      map(snapshot => {
        const trends: { [key: string]: number } = {};
        const now = new Date();

        snapshot.docs.forEach(doc => {
          const data = doc.data() as any;
          const entryDate = new Date(data.entry_date);
          const monthKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;

          const monthsAgo = (now.getFullYear() - entryDate.getFullYear()) * 12 + 
                           (now.getMonth() - entryDate.getMonth());

          if (monthsAgo <= months) {
            trends[monthKey] = (trends[monthKey] || 0) + (data.hours || 0);
          }
        });

        return Object.entries(trends).map(([key, hours]) => {
          const [year, month] = key.split('-').map(Number);
          return {
            year,
            month,
            total_hours: hours
          } as MonthlyTrend;
        }).sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.month - b.month;
        });
      })
    );
  }

  /**
   * Get yearly trend data for current candidate
   */
  getYearlyTrend(year: number): Observable<MonthlyTrend[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return from(Promise.resolve(Array.from({ length: 12 }, (_, i) => ({
        year,
        month: i + 1,
        total_hours: 0
      }))));
    }

    return from(
      getDocs(
        query(
          collection(this.firestore, 'timesheets'),
          where('candidate_id', '==', currentUser.user_id)
        )
      )
    ).pipe(
      map(snapshot => {
        const trends: { [key: number]: number } = {};

        snapshot.docs.forEach(doc => {
          const data = doc.data() as any;
          const entryDate = new Date(data.entry_date);

          if (entryDate.getFullYear() === year) {
            const month = entryDate.getMonth() + 1;
            trends[month] = (trends[month] || 0) + (data.hours || 0);
          }
        });

        return Array.from({ length: 12 }, (_, i) => ({
          year,
          month: i + 1,
          total_hours: trends[i + 1] || 0
        }));
      })
    );
  }
}
