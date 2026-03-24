import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { TokenStorageService } from './token-storage';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  const requiredRole: string = route.data['role'];
  const user = tokenStorage.getUser();

  if (user && user.role === requiredRole) {
    return true;
  }

  if (user) {
    return router.createUrlTree([user.role === 'admin' ? '/admin' : '/dashboard']);
  }
  return router.createUrlTree(['/auth/login']);
};
