import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Candidate, CandidateCreate, CandidateUpdate, Project, ProjectCreate, ProjectUpdate, TimesheetEntry } from '../core/models';
import { FirebaseAdminService } from '../core/firebase-admin.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private firebaseAdminService: FirebaseAdminService) {}

  // ── Projects ────────────────────────────────────────────────────
  getProjects(): Observable<Project[]> {
    return this.firebaseAdminService.getProjects();
  }

  createProject(data: ProjectCreate): Observable<Project> {
    return this.firebaseAdminService.createProject(data);
  }

  updateProject(projectId: number, data: ProjectUpdate): Observable<Project> {
    return this.firebaseAdminService.updateProject(projectId, data);
  }

  // ── Candidates ──────────────────────────────────────────────────
  getCandidates(): Observable<Candidate[]> {
    return this.firebaseAdminService.getCandidates();
  }

  createCandidate(data: CandidateCreate): Observable<Candidate> {
    return this.firebaseAdminService.createCandidate(data);
  }

  updateCandidate(userId: number, data: CandidateUpdate): Observable<Candidate> {
    return this.firebaseAdminService.updateCandidate(userId, data);
  }

  setCandidateStatus(userId: number, isActive: boolean): Observable<void> {
    return this.firebaseAdminService.setCandidateStatus(userId, isActive);
  }

  getCandidateTimesheet(userId: number, month: number, year: number): Observable<TimesheetEntry[]> {
    return this.firebaseAdminService.getCandidateTimesheet(userId, month, year);
  }

  getCandidateProjects(candidateId: number): Observable<Project[]> {
    return this.firebaseAdminService.getCandidateProjects(candidateId);
  }

  // ── Assignments ─────────────────────────────────────────────────
  assignProject(candidateId: number, projectId: number): Observable<void> {
    return this.firebaseAdminService.assignProject(candidateId, projectId);
  }

  // ── Admin Reports ───────────────────────────────────────────────
  getAdminProjectReport(month: number, year: number): Observable<any[]> {
    return this.firebaseAdminService.getAdminProjectReport(month, year);
  }
}
