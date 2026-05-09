import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const isAuthRequest =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh');

  if (!token || isAuthRequest) {
    return next(req);
  }

  const authenticatedRequest = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  });

  return next(authenticatedRequest);
};