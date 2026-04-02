import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRole: string = route.data['role'];
  const user = authService.getCurrentUser();

  if (user && user.role === requiredRole) {
    return true;
  }

  if (user) {
    return router.createUrlTree([user.role === 'admin' ? '/admin' : '/dashboard']);
  }
  return router.createUrlTree(['/auth/login']);
};
