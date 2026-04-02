import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoginRequest, TokenResponse, CurrentUser } from './models';
import { FirebaseAuthService } from './firebase-auth.service';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(
    private firebaseAuthService: FirebaseAuthService,
    private router: Router,
  ) {}

  /**
   * Login with Firebase
   */
  login(credentials: LoginRequest): Observable<TokenResponse> {
    return this.firebaseAuthService.login(credentials.email, credentials.password).pipe(
      map(res => ({
        access_token: res.access_token,
        refresh_token: res.refresh_token,
        token_type: res.token_type || 'Bearer',
        role: res.role || 'candidate',
        user_id: res.user_id,
        full_name: res.full_name || credentials.email
      } as TokenResponse))
    );
  }

  /**
   * Logout
   */
  logout(): void {
    this.firebaseAuthService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }

  /**
   * Get current user
   */
  getCurrentUser(): CurrentUser | null {
    return this.firebaseAuthService.getCurrentUser();
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.firebaseAuthService.isAuthenticated();
  }

  /**
   * Get user role
   */
  getRole(): string | null {
    return this.firebaseAuthService.getCurrentUser()?.role ?? null;
  }

  /**
   * Watch auth state changes
   */
  watchAuthState(): Observable<CurrentUser | null> {
    return this.firebaseAuthService.currentUser$;
  }
}
