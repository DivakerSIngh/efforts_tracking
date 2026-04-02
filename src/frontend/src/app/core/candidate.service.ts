import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Candidate, CandidateUpdate } from './models';
import { FirebaseCandidateService } from './firebase-candidate.service';

@Injectable({ providedIn: 'root' })
export class CandidateService {
  constructor(private firebaseCandidateService: FirebaseCandidateService) {}

  getMyProfile(): Observable<Candidate> {
    return this.firebaseCandidateService.getMyProfile();
  }

  updateMyProfile(data: CandidateUpdate): Observable<Candidate> {
    return this.firebaseCandidateService.updateMyProfile(data);
  }
}
