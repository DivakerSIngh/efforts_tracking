import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

/**
 * Auth Interceptor (Firebase Version)
 * Firebase handles authentication automatically via SDK.
 * This interceptor is kept minimal as a placeholder for future use.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  // With Firebase, we don't need to manually add authorization headers
  // Firebase SDK handles this automatically
  return next(req);
};

