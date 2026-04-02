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
  QueryConstraint
} from 'firebase/firestore';
import { Observable, from, map, switchMap } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { FirebaseAuthService } from './firebase-auth.service';
import { Candidate, CandidateCreate, CandidateUpdate, Project, ProjectCreate, ProjectUpdate, TimesheetEntry } from './models';

@Injectable({
  providedIn: 'root'
})
export class FirebaseAdminService {
  private firestore: Firestore;

  constructor(
    private firebaseService: FirebaseService,
    private authService: FirebaseAuthService
  ) {
    this.firestore = firebaseService.firestore;
  }

  // ─── Projects ──────────────────────────────────────────────────
  getProjects(): Observable<Project[]> {
    return from(
      getDocs(collection(this.firestore, 'projects'))
    ).pipe(
      map(snapshot => {
        return snapshot.docs.map(doc => {
          const data = doc.data() as any;
          return {
            project_id: data.project_id,
            name: data.name,
            client_name: data.client_name || '',
            description: data.description || '',
            is_active: data.is_active,
            created_date: data.created_date
          } as Project;
        });
      })
    );
  }

  createProject(data: ProjectCreate): Observable<Project> {
    const projectId = doc(collection(this.firestore, 'projects')).id;
    const newProject = {
      project_id: parseInt(projectId),
      name: data.name,
      client_name: data.client_name || '',
      description: data.description || '',
      is_active: true,
      created_date: new Date().toISOString()
    };

    return from(
      setDoc(doc(this.firestore, 'projects', projectId), newProject).then(() => newProject as Project)
    );
  }

  updateProject(projectId: number, data: ProjectUpdate): Observable<Project> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    if (data.name) updateData.name = data.name;
    if (data.client_name) updateData.client_name = data.client_name;
    if (data.description) updateData.description = data.description;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    return from(
      updateDoc(doc(this.firestore, 'projects', projectId.toString()), updateData).then(
        () => ({
          project_id: projectId,
          name: data.name || '',
          client_name: data.client_name || '',
          description: data.description || '',
          is_active: data.is_active || true
        } as Project)
      )
    );
  }

  // ─── Candidates ──────────────────────────────────────────────────
  getCandidates(): Observable<Candidate[]> {
    return from(
      getDocs(collection(this.firestore, 'users'))
    ).pipe(
      switchMap(userSnapshot => {
        // Filter only candidates
        const candidateIds = userSnapshot.docs
          .filter(doc => (doc.data() as any).role === 'candidate')
          .map(doc => doc.id);

        if (candidateIds.length === 0) return from(Promise.resolve([]));

        // Get candidate details
        return from(
          getDocs(collection(this.firestore, 'candidates'))
        ).pipe(
          map(candidateSnapshot => {
            return userSnapshot.docs
              .filter(doc => (doc.data() as any).role === 'candidate')
              .map(userDoc => {
                const userData = userDoc.data() as any;
                const candData = candidateSnapshot.docs
                  .find(d => d.id === userDoc.id)?.data() as any;

                return {
                  user_id: userData.user_id,
                  email: userData.email,
                  full_name: userData.full_name,
                  phone: candData?.phone || '',
                  hourly_rate: candData?.hourly_rate || 0,
                  fixed_amount: candData?.fixed_amount || 0,
                  account_no: candData?.account_no || '',
                  ifsc_code: candData?.ifsc_code || '',
                  is_active: userData.is_active,
                  created_date: userData.created_date
                } as Candidate;
              });
          })
        );
      })
    );
  }

  createCandidate(data: CandidateCreate): Observable<Candidate> {
    const candidateId = crypto.randomUUID();

    const userData = {
      user_id: candidateId,
      email: data.email,
      full_name: data.full_name,
      role: 'candidate',
      is_active: true,
      created_date: new Date().toISOString()
    };

    const candidateData = {
      user_id: candidateId,
      phone: data.phone || '',
      hourly_rate: data.hourly_rate || 0,
      fixed_amount: data.fixed_amount || 0,
      account_no: data.account_no || '',
      ifsc_code: data.ifsc_code || ''
    };

    return from(
      setDoc(doc(this.firestore, 'users', candidateId), userData)
        .then(() => setDoc(doc(this.firestore, 'candidates', candidateId), candidateData))
        .then(() => ({
          ...userData,
          ...candidateData
        } as any as Candidate))
    );
  }

  updateCandidate(userId: number, data: CandidateUpdate): Observable<Candidate> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.hourly_rate !== undefined) updateData.hourly_rate = data.hourly_rate;
    if (data.fixed_amount !== undefined) updateData.fixed_amount = data.fixed_amount;
    if (data.account_no !== undefined) updateData.account_no = data.account_no;
    if (data.ifsc_code !== undefined) updateData.ifsc_code = data.ifsc_code;

    return from(
      updateDoc(doc(this.firestore, 'candidates', userId.toString()), updateData).then(
        () => ({
          user_id: userId,
          email: '',
          full_name: '',
          ...data
        } as Candidate)
      )
    );
  }

  setCandidateStatus(userId: number, isActive: boolean): Observable<void> {
    return from(
      updateDoc(doc(this.firestore, 'users', userId.toString()), {
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
    );
  }

  getCandidateTimesheet(userId: number, month: number, year: number): Observable<TimesheetEntry[]> {
    return from(
      getDocs(
        query(
          collection(this.firestore, 'timesheets'),
          where('candidate_id', '==', userId)
        )
      )
    ).pipe(
      map(snapshot => {
        return snapshot.docs
          .map(doc => {
            const data = doc.data() as any;
            const entryDate = new Date(data.entry_date);

            if (
              entryDate.getMonth() === month - 1 &&
              entryDate.getFullYear() === year
            ) {
              return {
                entry_id: data.entry_id,
                project_id: data.project_id,
                project_name: data.project_name || '',
                entry_date: data.entry_date,
                hours: data.hours,
                remarks: data.remarks
              } as TimesheetEntry;
            }
            return null;
          })
          .filter(entry => entry !== null) as TimesheetEntry[];
      })
    );
  }

  getCandidateProjects(candidateId: number): Observable<Project[]> {
    return from(
      getDocs(
        query(
          collection(this.firestore, 'assignments'),
          where('candidate_id', '==', candidateId)
        )
      )
    ).pipe(
      switchMap(assignmentSnapshot => {
        const projectIds = assignmentSnapshot.docs.map(doc => (doc.data() as any).project_id);
        
        if (projectIds.length === 0) return from(Promise.resolve([]));

        return from(getDocs(collection(this.firestore, 'projects'))).pipe(
          map(projectSnapshot => {
            return projectSnapshot.docs
              .filter(doc => projectIds.includes((doc.data() as any).project_id))
              .map(doc => {
                const data = doc.data() as any;
                return {
                  project_id: data.project_id,
                  name: data.name,
                  client_name: data.client_name || '',
                  description: data.description || '',
                  is_active: data.is_active,
                  created_date: data.created_date
                } as Project;
              });
          })
        );
      })
    );
  }

  // ─── Assignments ──────────────────────────────────────────────────
  assignProject(candidateId: number, projectId: number): Observable<void> {
    const assignmentId = doc(collection(this.firestore, 'assignments')).id;

    return from(
      setDoc(doc(this.firestore, 'assignments', assignmentId), {
        assignment_id: parseInt(assignmentId),
        candidate_id: candidateId,
        project_id: projectId,
        assigned_date: new Date().toISOString()
      })
    );
  }

  // ─── Admin Reports ───────────────────────────────────────────────────
  getAdminProjectReport(month: number, year: number): Observable<any[]> {
    return from(
      getDocs(collection(this.firestore, 'timesheets'))
    ).pipe(
      map(snapshot => {
        const reportData: any[] = [];

        snapshot.docs.forEach(doc => {
          const data = doc.data() as any;
          const entryDate = new Date(data.entry_date);

          if (
            entryDate.getMonth() === month - 1 &&
            entryDate.getFullYear() === year
          ) {
            reportData.push({
              project_id: data.project_id,
              candidate_id: data.candidate_id,
              hours: data.hours,
              entry_date: data.entry_date
            });
          }
        });

        return reportData;
      })
    );
  }
}
