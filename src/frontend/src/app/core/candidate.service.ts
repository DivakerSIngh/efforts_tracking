import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Candidate, CandidateUpdate } from './models';

@Injectable({ providedIn: 'root' })
export class CandidateService {
  private apiUrl = '/api/candidates';

  constructor(private http: HttpClient) {}

  getMyProfile(): Observable<Candidate> {
    return this.http.get<Candidate>(`${this.apiUrl}/me`);
  }

  updateMyProfile(data: CandidateUpdate): Observable<Candidate> {
    return this.http.put<Candidate>(`${this.apiUrl}/me`, data);
  }
}
