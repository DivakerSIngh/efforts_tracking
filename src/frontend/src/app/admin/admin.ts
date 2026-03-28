import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Candidate, CandidateCreate, CandidateUpdate, Project, ProjectCreate, ProjectUpdate, TimesheetEntry } from '../core/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private projectsUrl = `${environment.apiUrl}/projects`;
  private candidatesUrl = `${environment.apiUrl}/candidates`;
  private reportUrl = `${environment.apiUrl}/report`;

  constructor(private http: HttpClient) {}

  // ── Projects ────────────────────────────────────────────────────
  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.projectsUrl}`);
  }

  createProject(data: ProjectCreate): Observable<Project> {
    return this.http.post<Project>(`${this.projectsUrl}`, data);
  }

  updateProject(projectId: number, data: ProjectUpdate): Observable<Project> {
    return this.http.put<Project>(`${this.projectsUrl}/${projectId}`, data);
  }

  // ── Candidates ──────────────────────────────────────────────────
  getCandidates(): Observable<Candidate[]> {
    return this.http.get<Candidate[]>(`${this.candidatesUrl}`);
  }

  createCandidate(data: CandidateCreate): Observable<Candidate> {
    return this.http.post<Candidate>(`${this.candidatesUrl}`, data);
  }

  updateCandidate(userId: number, data: CandidateUpdate): Observable<Candidate> {
    return this.http.put<Candidate>(`${this.candidatesUrl}/${userId}`, data);
  }

  setCandidateStatus(userId: number, isActive: boolean): Observable<void> {
    return this.http.patch<void>(`${this.candidatesUrl}/${userId}/status?is_active=${isActive}`, {});
  }

  getCandidateTimesheet(userId: number, month: number, year: number): Observable<TimesheetEntry[]> {
    return this.http.get<TimesheetEntry[]>(`${this.candidatesUrl}/${userId}/timesheet?month=${month}&year=${year}`);
  }

  getCandidateProjects(candidateId: number): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.candidatesUrl}/${candidateId}/projects`);
  }

  // ── Assignments ─────────────────────────────────────────────────
  assignProject(candidateId: number, projectId: number): Observable<void> {
    return this.http.post<void>(`${this.projectsUrl}/assign`, { candidate_id: candidateId, project_id: projectId });
  }

  // ── Admin Reports ───────────────────────────────────────────────
  getAdminProjectReport(month: number, year: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.reportUrl}/admin/projects?month=${month}&year=${year}`);
  }
}
