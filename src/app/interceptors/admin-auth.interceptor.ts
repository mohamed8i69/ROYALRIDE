import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AdminAuthService } from '../services/admin-auth.service';

/**
 * Determine if an API request is public and should never receive an admin JWT:
 * - GET /api/site-content (public site content)
 * - POST /api/orders (public guest booking creation)
 * - POST /api/auth/login (admin login credential submission)
 */
function isPublicApiRequest(request: HttpRequest<unknown>): boolean {
  const url = request.url;
  if (request.method === 'GET' && url.includes('/api/site-content')) {
    return true;
  }
  if (request.method === 'POST' && (url.endsWith('/api/orders') || url.includes('/api/orders?'))) {
    return true;
  }
  if (request.method === 'POST' && url.includes('/api/auth/login')) {
    return true;
  }
  return false;
}

export const adminAuthInterceptor: HttpInterceptorFn = (request, next) => {
  // If not an API request, or if it is a public endpoint, pass through unmodified
  if (!request.url.includes('/api/') || isPublicApiRequest(request)) {
    return next(request);
  }

  const token = inject(AdminAuthService).token();
  if (!token) {
    return next(request);
  }

  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

