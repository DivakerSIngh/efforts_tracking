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
  QueryConstraint
} from 'firebase/firestore';
import { Observable, from, map, switchMap } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { FirebaseAuthService } from './firebase-auth.service';
import { Candidate, CandidateUpdate } from './models';

@Injectable({
  providedIn: 'root'
})
export class FirebaseCandidateService {
  private firestore: Firestore;

  constructor(
    private firebaseService: FirebaseService,
    private authService: FirebaseAuthService
  ) {
    this.firestore = firebaseService.firestore;
  }

  /**
   * Get my profile (for candidate)
   */
  getMyProfile(): Observable<Candidate> {
    return from(
      this.authService.watchAuthState().pipe(
        switchMap(user => {
          if (!user) throw new Error('Not authenticated');
          
          return from(
            getDocs(
              query(
                collection(this.firestore, 'users'),
                where('user_id', '==', user.user_id)
              )
            )
          ).pipe(
            switchMap(snapshot => {
              if (snapshot.empty) throw new Error('User not found');
              
              const userData = snapshot.docs[0].data() as any;
              
              // Get candidate details
              return from(
                getDocs(
                  query(
                    collection(this.firestore, 'candidates'),
                    where('user_id', '==', user.user_id)
                  )
                )
              ).pipe(
                map(candidateSnapshot => {
                  const candidateData = candidateSnapshot.empty
                    ? {}
                    : candidateSnapshot.docs[0].data();
                  
                  return {
                    user_id: user.user_id,
                    email: userData.email,
                    full_name: userData.full_name,
                    phone: (candidateData as any)?.phone || '',
                    hourly_rate: (candidateData as any)?.hourly_rate || 0,
                    fixed_amount: (candidateData as any)?.fixed_amount || 0,
                    account_no: (candidateData as any)?.account_no || '',
                    ifsc_code: (candidateData as any)?.ifsc_code || '',
                    is_active: userData.is_active,
                    created_date: userData.created_date
                  } as Candidate;
                })
              );
            })
          );
        })
      )
    );
  }

  /**
   * Update my profile
   */
  updateMyProfile(data: CandidateUpdate): Observable<Candidate> {
    return from(
      this.authService.watchAuthState().pipe(
        switchMap(user => {
          if (!user) throw new Error('Not authenticated');
          
          return from(
            updateDoc(
              doc(this.firestore, 'candidates', user.user_id.toString()),
              {
                phone: data.phone,
                hourly_rate: data.hourly_rate,
                fixed_amount: data.fixed_amount,
                account_no: data.account_no,
                ifsc_code: data.ifsc_code,
                updated_at: new Date().toISOString()
              }
            )
          ).pipe(
            switchMap(() => this.getMyProfile())
          );
        })
      )
    );
  }
}
