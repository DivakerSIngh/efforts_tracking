import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Candidate, CandidateCreate, CandidateUpdate, Project, ProjectCreate, ProjectUpdate, TimesheetEntry } from '../core/models';

@Injectable({ providedIn: 'root' })
export class AdminService {

  constructor(private http: HttpClient) {}

  // ── Projects ────────────────────────────────────────────────────
  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>('/api/projects');
  }

  createProject(data: ProjectCreate): Observable<Project> {
    return this.http.post<Project>('/api/projects', data);
  }

  updateProject(projectId: number, data: ProjectUpdate): Observable<Project> {
    return this.http.put<Project>(`/api/projects/${projectId}`, data);
  }

  // ── Candidates ──────────────────────────────────────────────────
  getCandidates(): Observable<Candidate[]> {
    return this.http.get<Candidate[]>('/api/candidates');
  }

  createCandidate(data: CandidateCreate): Observable<Candidate> {
    return this.http.post<Candidate>('/api/candidates', data);
  }

  updateCandidate(userId: number, data: CandidateUpdate): Observable<Candidate> {
    return this.http.put<Candidate>(`/api/candidates/${userId}`, data);
  }

  setCandidateStatus(userId: number, isActive: boolean): Observable<void> {
    return this.http.patch<void>(`/api/candidates/${userId}/status?is_active=${isActive}`, {});
  }

  getCandidateTimesheet(userId: number, month: number, year: number): Observable<TimesheetEntry[]> {
    return this.http.get<TimesheetEntry[]>(`/api/candidates/${userId}/timesheet?month=${month}&year=${year}`);
  }

  getCandidateProjects(candidateId: number): Observable<Project[]> {
    return this.http.get<Project[]>(`/api/candidates/${candidateId}/projects`);
  }

  // ── Assignments ─────────────────────────────────────────────────
  assignProject(candidateId: number, projectId: number): Observable<void> {
    return this.http.post<void>('/api/projects/assign', { candidate_id: candidateId, project_id: projectId });
  }
}
