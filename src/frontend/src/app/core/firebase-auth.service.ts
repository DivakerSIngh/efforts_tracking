import { Injectable } from '@angular/core';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
  Auth,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Observable, from, BehaviorSubject, map } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { CurrentUser } from './models';

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  private auth: Auth;
  private firestore: Firestore;
  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Emits true once Firebase has resolved the initial auth state
  private authInitializedSubject = new BehaviorSubject<boolean>(false);
  public authInitialized$ = this.authInitializedSubject.asObservable();

  constructor(private firebaseService: FirebaseService) {
    this.auth = firebaseService.auth;
    this.firestore = firebaseService.firestore;
    this.initializeAuthStateListener();
  }

  /**
   * Initialize auth state listener
   */
  private initializeAuthStateListener(): void {
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User logged in - get user data from Firestore by email
        const userQuery = query(
          collection(this.firestore, 'users'),
          where('email', '==', firebaseUser.email)
        );
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data() as any;
          this.currentUserSubject.next({
            uid: firebaseUser.uid,
            user_id: userData.user_id,
            email: firebaseUser.email || '',
            full_name: userData.full_name || '',
            role: userData.role || 'candidate'
          });
        }
      } else {
        // User logged out
        this.currentUserSubject.next(null);
      }
      // Signal that Firebase auth state has been resolved
      this.authInitializedSubject.next(true);
    });
  }

  /**
   * Login with email and password
   */
  login(email: string, password: string): Observable<any> {
    return from(
      signInWithEmailAndPassword(this.auth, email, password).then(
        async (userCredential: UserCredential) => {
          const firebaseUser = userCredential.user;
          
          // Fetch user data from Firestore by email
          const userQuery = query(
            collection(this.firestore, 'users'),
            where('email', '==', firebaseUser.email)
          );
          const userSnapshot = await getDocs(userQuery);
          
          let userData: any = {
            user_id: firebaseUser.uid,
            full_name: firebaseUser.email,
            role: 'candidate'
          };
          
          if (!userSnapshot.empty) {
            userData = userSnapshot.docs[0].data() as any;
          }
          
          // Update current user subject so getCurrentUser() works immediately
          this.currentUserSubject.next({
            uid: firebaseUser.uid,
            user_id: userData.user_id || firebaseUser.uid,
            email: firebaseUser.email || '',
            full_name: userData.full_name || '',
            role: userData.role || 'candidate'
          });
          
          return {
            access_token: firebaseUser.uid,
            refresh_token: 'firebase-refresh-token',
            token_type: 'Bearer',
            user_id: userData.user_id || firebaseUser.uid,
            email: firebaseUser.email,
            full_name: userData.full_name || '',
            role: userData.role || 'candidate'
          };
        }
      )
    );
  }

  /**
   * Register new user
   */
  register(
    email: string,
    password: string,
    userData: Partial<CurrentUser>
  ): Observable<any> {
    return from(
      createUserWithEmailAndPassword(this.auth, email, password).then(
        async (userCredential: UserCredential) => {
          const uid = userCredential.user.uid;
          
          // Store user data in Firestore
          await setDoc(doc(this.firestore, 'users', uid), {
            uid,
            email,
            full_name: userData.full_name || '',
            role: userData.role || 'candidate',
            created_date: new Date().toISOString(),
            is_active: true
          });

          return {
            access_token: uid,
            user_id: uid,
            email,
            full_name: userData.full_name || '',
            role: userData.role || 'candidate'
          };
        }
      )
    );
  }

  /**
   * Logout
   */
  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  /**
   * Get current user
   */
  getCurrentUser(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get current Firebase user ID
   */
  getCurrentUserId(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  /**
   * Get auth token
   */
  async getAuthToken(): Promise<string | null> {
    return this.auth.currentUser?.getIdToken() ?? null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.auth.currentUser;
  }

  /**
   * Get user role
   */
  getRole(): string | null {
    return this.currentUserSubject.value?.role ?? null;
  }

  /**
   * Is admin
   */
  isAdmin(): boolean {
    return this.getRole() === 'admin';
  }

  /**
   * Watch auth state changes
   */
  watchAuthState(): Observable<CurrentUser | null> {
    return this.currentUser$;
  }
}
