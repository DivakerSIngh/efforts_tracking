import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, first, map } from 'rxjs';
import { AuthService } from './auth';
import { FirebaseAuthService } from './firebase-auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const firebaseAuth = inject(FirebaseAuthService);
  const router = inject(Router);

  // Wait for Firebase to resolve its auth state before checking login
  return firebaseAuth.authInitialized$.pipe(
    filter(initialized => initialized),
    first(),
    map(() => {
      if (authService.isLoggedIn()) return true;
      return router.createUrlTree(['/auth/login']);
    })
  );
};
