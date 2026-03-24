import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginRequest, TokenResponse, CurrentUser } from './models';
import { TokenStorageService } from './token-storage';

const API = '/api/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(
    private http: HttpClient,
    private router: Router,
    private tokenStorage: TokenStorageService,
  ) {}

  login(credentials: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${API}/login`, credentials).pipe(
      tap(res => {
        this.tokenStorage.saveToken(res.access_token);
        this.tokenStorage.saveRefreshToken(res.refresh_token);
        this.tokenStorage.saveUser({
          user_id: res.user_id,
          email: credentials.email,
          role: res.role,
          full_name: res.full_name,
        });
      }),
    );
  }

  logout(): void {
    this.tokenStorage.clear();
    this.router.navigate(['/auth/login']);
  }

  getCurrentUser(): CurrentUser | null {
    return this.tokenStorage.getUser();
  }

  isLoggedIn(): boolean {
    return this.tokenStorage.isLoggedIn();
  }

  getRole(): string | null {
    return this.tokenStorage.getUser()?.role ?? null;
  }
}
