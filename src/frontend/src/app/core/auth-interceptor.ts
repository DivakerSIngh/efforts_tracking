import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { TokenStorageService } from './token-storage';

const REFRESH_URL = '/api/auth/refresh';

// Shared state across interceptor calls to handle concurrent 401s
let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) });
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);
  const http = inject(HttpClient);

  const token = tokenStorage.getToken();
  const authed = token ? addToken(req, token) : req;

  return next(authed).pipe(
    catchError((err: HttpErrorResponse) => {
      // Don't retry the refresh endpoint itself — avoid infinite loop
      if (err.status !== 401 || req.url.includes(REFRESH_URL)) {
        if (err.status === 401) {
          tokenStorage.clear();
          router.navigate(['/auth/login']);
        }
        return throwError(() => err);
      }

      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        tokenStorage.clear();
        router.navigate(['/auth/login']);
        return throwError(() => err);
      }

      if (isRefreshing) {
        // Queue this request until the ongoing refresh completes
        return refreshDone$.pipe(
          filter(t => t !== null),
          take(1),
          switchMap(newToken => next(addToken(req, newToken!))),
        );
      }

      isRefreshing = true;
      refreshDone$.next(null);

      return http.post<{ access_token: string; refresh_token: string }>(
        REFRESH_URL,
        { refresh_token: refreshToken },
      ).pipe(
        switchMap(res => {
          isRefreshing = false;
          tokenStorage.saveToken(res.access_token);
          tokenStorage.saveRefreshToken(res.refresh_token);
          refreshDone$.next(res.access_token);
          return next(addToken(req, res.access_token));
        }),
        catchError(refreshErr => {
          isRefreshing = false;
          refreshDone$.next(null);
          tokenStorage.clear();
          router.navigate(['/auth/login']);
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};

