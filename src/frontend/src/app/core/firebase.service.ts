import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from '../../environments/firebase.config';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  auth: Auth;
  firestore: Firestore;

  constructor() {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    
    // Initialize Firebase Auth and Firestore
    this.auth = getAuth(app);
    this.firestore = getFirestore(app);
  }

  /**
   * Initialize persistence for offline support
   */
  initializePersistence(): void {
    // Firestore offline persistence is enabled by default in browser apps
    // No additional setup needed
  }

  /**
   * Health check
   */
  getHealthStatus(): { auth: boolean; firestore: boolean } {
    return {
      auth: !!this.auth,
      firestore: !!this.firestore
    };
  }
}
