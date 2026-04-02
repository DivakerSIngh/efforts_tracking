import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  Query,
  QueryConstraint,
  Query as FirebaseQuery,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { Observable, from, map, switchMap } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { FirebaseAuthService } from './firebase-auth.service';
import { Project, TimesheetEntry, TimesheetEntryCreate, TimesheetEntryUpdate } from './models';

@Injectable({
  providedIn: 'root'
})
export class FirebaseTimesheetService {
  private firestore: Firestore;

  constructor(
    private firebaseService: FirebaseService,
    private authService: FirebaseAuthService
  ) {
    this.firestore = firebaseService.firestore;
  }

  /**
   * Get projects assigned to current candidate
   */
  getAssignedProjects(): Observable<Project[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return from(Promise.resolve([]));
    }

    return from(
      getDocs(
        query(
          collection(this.firestore, 'assignments'),
          where('candidate_id', '==', currentUser.user_id)
        )
      )
    ).pipe(
      map(assignmentSnapshot => {
        const projectIds = assignmentSnapshot.docs.map(doc => (doc.data() as any).project_id);
        return projectIds;
      }),
      switchMap(projectIds => {
        if (projectIds.length === 0) return from(Promise.resolve([]));

        // Fetch all projects
        return from(
          getDocs(collection(this.firestore, 'projects')).then(projectSnapshot =>
            projectSnapshot.docs
              .map(doc => doc.data() as any)
              .filter(project => projectIds.includes(project.project_id)) as Project[]
          )
        );
      })
    );
  }

  /**
   * Get timesheet entries for current candidate with project names
   */
  getTimesheet(month: number, year: number): Observable<TimesheetEntry[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return from(Promise.resolve([]));
    }

    return from(
      Promise.all([
        getDocs(
          query(
            collection(this.firestore, 'timesheets'),
            where('candidate_id', '==', currentUser.user_id)
          )
        ),
        getDocs(collection(this.firestore, 'projects'))
      ])
    ).pipe(
      map(([timesheetSnapshot, projectSnapshot]) => {
        // Create project map for quick lookup
        const projectMap = new Map();
        projectSnapshot.docs.forEach(doc => {
          const data = doc.data() as any;
          projectMap.set(data.project_id, data.name);
        });

        // Process and deduplicate timesheet entries by (project_id, entry_date)
        const dedupMap = new Map<string, TimesheetEntry>();
        timesheetSnapshot.docs.forEach(doc => {
          const data = doc.data() as any;
          const entryDate = new Date(data.entry_date);

          if (
            entryDate.getMonth() === month - 1 &&
            entryDate.getFullYear() === year
          ) {
            // Normalize entry_date to YYYY-MM-DD to avoid mismatches from stored time components
            const normalDate = typeof data.entry_date === 'string' ? data.entry_date.split('T')[0] : data.entry_date;
            const key = `${data.project_id}-${normalDate}`;
            const existing = dedupMap.get(key);
            const newId = isFinite(data.entry_id) ? data.entry_id : 0;
            const curId = existing && isFinite(existing.entry_id) ? existing.entry_id : 0;
            // Keep the entry with the highest entry_id (most recent save wins)
            if (!existing || newId > curId) {
              dedupMap.set(key, {
                entry_id: data.entry_id,
                project_id: data.project_id,
                project_name: projectMap.get(data.project_id) || data.project_name || 'Unknown',
                entry_date: data.entry_date,
                hours: data.hours || 0,
                remarks: data.remarks || ''
              } as TimesheetEntry);
            }
          }
        });

        return Array.from(dedupMap.values());
      })
    );
  }

  /**
   * Add timesheet entry with project name
   */
  addEntry(entry: TimesheetEntryCreate): Observable<TimesheetEntry> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return from(Promise.reject(new Error('Not authenticated')));
    }

    return from(
      (async () => {
        // Fetch project name
        const projectSnapshot = await getDocs(
          query(
            collection(this.firestore, 'projects'),
            where('project_id', '==', entry.project_id)
          )
        );

        let projectName = 'Unknown';
        if (!projectSnapshot.empty) {
          projectName = projectSnapshot.docs[0].data()['name'];
        }

        const entryId = Date.now(); // reliable numeric ID
        const newEntry = {
          entry_id: entryId,
          candidate_id: currentUser.user_id,
          project_id: entry.project_id,
          project_name: projectName,
          entry_date: entry.entry_date,
          hours: entry.hours || 0,
          remarks: entry.remarks || '',
          created_at: new Date().toISOString()
        };

        await setDoc(doc(this.firestore, 'timesheets', entryId.toString()), newEntry);

        return {
          entry_id: entryId,
          project_id: entry.project_id,
          project_name: projectName,
          entry_date: entry.entry_date,
          hours: entry.hours || 0,
          remarks: entry.remarks || ''
        } as TimesheetEntry;
      })()
    );
  }

  /**
   * Update timesheet entry
   */
  updateEntry(entryId: number, data: TimesheetEntryUpdate): Observable<TimesheetEntry> {
    // Only update fields that are explicitly provided
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (data.hours != null) updateData['hours'] = data.hours;
    if (data.remarks !== undefined) updateData['remarks'] = data.remarks;

    return from(
      updateDoc(doc(this.firestore, 'timesheets', entryId.toString()), updateData).then(() => ({
        entry_id: entryId,
        project_id: 0,
        project_name: '',
        entry_date: '',
        hours: data.hours ?? 0,
        remarks: data.remarks || ''
      } as TimesheetEntry)).catch(async () => {
        // fallback: query by entry_id field (for legacy NaN docs)
        const snapshot = await getDocs(
          query(collection(this.firestore, 'timesheets'), where('entry_id', '==', entryId))
        );
        if (!snapshot.empty) {
          const fallbackUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
          if (data.hours != null) fallbackUpdate['hours'] = data.hours;
          if (data.remarks !== undefined) fallbackUpdate['remarks'] = data.remarks;
          await updateDoc(snapshot.docs[0].ref, fallbackUpdate);
        }
        return {
          entry_id: entryId,
          project_id: 0,
          project_name: '',
          entry_date: '',
          hours: data.hours ?? 0,
          remarks: data.remarks || ''
        } as TimesheetEntry;
      })
    );
  }

  /**
   * Delete timesheet entry
   */
  deleteEntry(entryId: number): Observable<void> {
    return from(
      deleteDoc(doc(this.firestore, 'timesheets', entryId.toString())).catch(async () => {
        // fallback: query by entry_id field (for legacy NaN docs)
        const snapshot = await getDocs(
          query(collection(this.firestore, 'timesheets'), where('entry_id', '==', entryId))
        );
        if (!snapshot.empty) {
          await deleteDoc(snapshot.docs[0].ref);
        }
      })
    );
  }
}
