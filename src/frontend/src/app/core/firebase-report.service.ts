import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { Observable, from, map, switchMap } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { FirebaseAuthService } from './firebase-auth.service';
import { CandidateReportRow } from './models';

@Injectable({
  providedIn: 'root'
})
export class FirebaseReportService {
  private firestore: Firestore;

  constructor(
    private firebaseService: FirebaseService,
    private authService: FirebaseAuthService
  ) {
    this.firestore = firebaseService.firestore;
  }

  /**
   * Get unified report - scoped by role automatically
   */
  getReport(month: number, year: number): Observable<CandidateReportRow[]> {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      return from(Promise.resolve([]));
    }

    // If candidate, show only their data
    if (currentUser.role === 'candidate') {
      return this.getCandidateSummary(month, year);
    }

    // If admin, show all candidates
    return this.getAllCandidatesReport(month, year);
  }

  /**
   * Get all candidates report (admin only)
   */
  getAllCandidatesReport(month: number, year: number): Observable<CandidateReportRow[]> {
    return from(
      getDocs(collection(this.firestore, 'timesheets'))
    ).pipe(
      switchMap(timesheetSnapshot => {
        // Filter by month/year
        const filteredTimesheets = timesheetSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(doc => {
            const entryDate = new Date((doc as any).entry_date);
            return (
              entryDate.getMonth() === month - 1 &&
              entryDate.getFullYear() === year
            );
          });

        if (filteredTimesheets.length === 0) {
          return from(Promise.resolve([]));
        }

        return from(
          Promise.all([
            getDocs(collection(this.firestore, 'users')),
            getDocs(collection(this.firestore, 'candidates')),
            getDocs(collection(this.firestore, 'projects'))
          ])
        ).pipe(
          map(([userSnapshot, candidateSnapshot, projectSnapshot]) => {
            const usersMap = new Map();
            const candidatesMap = new Map();
            const projectsMap = new Map();

            userSnapshot.docs.forEach(doc => {
              const userData = doc.data() as any;
              usersMap.set(userData.user_id, userData);
            });

            candidateSnapshot.docs.forEach(doc => {
              const candidateData = doc.data() as any;
              candidatesMap.set(candidateData.user_id, candidateData);
            });

            projectSnapshot.docs.forEach(doc => {
              projectsMap.set((doc.data() as any).project_id, doc.data());
            });

            // Deduplicate: keep only one entry per (candidate_id, project_id, entry_date)
            const dedupMap = new Map<string, any>();
            filteredTimesheets.forEach(ts => {
              const d = ts as any;
              // Normalize entry_date to YYYY-MM-DD to avoid mismatches from stored time components
              const normalDate = typeof d.entry_date === 'string' ? d.entry_date.split('T')[0] : d.entry_date;
              const dedupKey = `${d.candidate_id}-${d.project_id}-${normalDate}`;
              // Keep the entry with the highest entry_id (most recent save); treat NaN/null as 0
              const newId = isFinite(d.entry_id) ? d.entry_id : 0;
              const curId = dedupMap.has(dedupKey) && isFinite(dedupMap.get(dedupKey).entry_id) ? dedupMap.get(dedupKey).entry_id : 0;
              if (!dedupMap.has(dedupKey) || newId > curId) {
                dedupMap.set(dedupKey, d);
              }
            });
            const uniqueTimesheets = Array.from(dedupMap.values());

            // Build report - return project-level data for frontend to aggregate
            const reportMap = new Map<string, any>();

            uniqueTimesheets.forEach(data => {
              const candidateData = usersMap.get(data.candidate_id);
              const projectData = projectsMap.get(data.project_id);

              if (candidateData && projectData) {
                const key = `${data.candidate_id}-${data.project_id}`; // Group by candidate-project

                if (!reportMap.has(key)) {
                  reportMap.set(key, {
                    candidate_id: data.candidate_id,
                    candidate_name: candidateData.full_name,
                    email: candidateData.email,
                    project_id: data.project_id,
                    project_name: projectData.name,
                    total_hours: 0,
                    hourly_rate: candidatesMap.get(data.candidate_id)?.hourly_rate || 0,
                    fixed_amount: candidatesMap.get(data.candidate_id)?.fixed_amount || 0,
                    total_amount: 0
                  });
                }

                const row = reportMap.get(key);
                row.total_hours += data.hours;
              }
            });

            return Array.from(reportMap.values()) as CandidateReportRow[];
          })
        );
      })
    );
  }

  /**
   * Get candidate's own summary (candidate view)
   */
  getCandidateSummary(month: number, year: number): Observable<CandidateReportRow[]> {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      return from(Promise.resolve([]));
    }

    return from(
      getDocs(
        query(
          collection(this.firestore, 'timesheets'),
          where('candidate_id', '==', currentUser.user_id)
        )
      )
    ).pipe(
      switchMap(timesheetSnapshot => {
        const filteredTimesheets = timesheetSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(doc => {
            const entryDate = new Date((doc as any).entry_date);
            return (
              entryDate.getMonth() === month - 1 &&
              entryDate.getFullYear() === year
            );
          });

        if (filteredTimesheets.length === 0) {
          return from(Promise.resolve([]));
        }

        return from(
          Promise.all([
            getDocs(collection(this.firestore, 'candidates')),
            getDocs(collection(this.firestore, 'projects'))
          ])
        ).pipe(
          map(([candidateSnapshot, projectSnapshot]) => {
            const candidatesMap = new Map();
            const projectsMap = new Map();

            candidateSnapshot.docs.forEach(doc => {
              const candidateData = doc.data() as any;
              candidatesMap.set(candidateData.user_id, candidateData);
            });

            projectSnapshot.docs.forEach(doc => {
              projectsMap.set((doc.data() as any).project_id, doc.data());
            });

            const reportMap = new Map<number, any>();

            // Deduplicate: keep only one entry per (project_id, entry_date)
            const dedupMap = new Map<string, any>();
            filteredTimesheets.forEach(ts => {
              const d = ts as any;
              const normalDate = typeof d.entry_date === 'string' ? d.entry_date.split('T')[0] : d.entry_date;
              const dedupKey = `${d.project_id}-${normalDate}`;
              const newId = isFinite(d.entry_id) ? d.entry_id : 0;
              const curId = dedupMap.has(dedupKey) && isFinite(dedupMap.get(dedupKey).entry_id) ? dedupMap.get(dedupKey).entry_id : 0;
              if (!dedupMap.has(dedupKey) || newId > curId) {
                dedupMap.set(dedupKey, d);
              }
            });
            const uniqueTimesheets = Array.from(dedupMap.values());

            uniqueTimesheets.forEach(data => {
              const projectData = projectsMap.get(data.project_id);

              if (projectData) {
                if (!reportMap.has(data.project_id)) {
                  reportMap.set(data.project_id, {
                    candidate_id: currentUser.user_id,
                    candidate_name: currentUser.full_name,
                    email: currentUser.email,
                    project_id: data.project_id,
                    project_name: projectData.name,
                    total_hours: 0,
                    hourly_rate: candidatesMap.get(currentUser.user_id)?.hourly_rate || 0,
                    fixed_amount: candidatesMap.get(currentUser.user_id)?.fixed_amount || 0,
                    total_amount: 0
                  });
                }

                const row = reportMap.get(data.project_id);
                row.total_hours += data.hours;
              }
            });

            return Array.from(reportMap.values()) as CandidateReportRow[];
          })
        );
      })
    );
  }

  /**
   * Export Excel (returns sample data structure)
   */
  exportExcel(month: number, year: number): Observable<Blob> {
    return this.getAllCandidatesReport(month, year).pipe(
      map(reportData => {
        // Create CSV from report data
        const headers = ['Candidate ID', 'Candidate Name', 'Email', 'Project ID', 'Project Name', 'Hours', 'Rate', 'Amount'];
        const rows = reportData.map(row => [
          row.candidate_id,
          row.candidate_name,
          row.email,
          row.project_id,
          row.project_name,
          row.project_hours,
          row.hourly_rate,
          row.total_amount
        ]);

        const csv = [
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n');

        return new Blob([csv], { type: 'text/csv' });
      })
    );
  }
}
