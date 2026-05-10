import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  filter,
  switchMap,
  take,
  throwError
} from 'rxjs';

import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshToken$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  if (isAuthEndpoint(req.url)) {
    return next(req);
  }

  const authenticatedRequest = addToken(req, authService.getToken());

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      return handleUnauthorized(authService, req, next);
    })
  );
};

function addToken(
  req: HttpRequest<unknown>,
  token: string | null
): HttpRequest<unknown> {
  if (!token) {
    return req;
  }

  return req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  });
}

function handleUnauthorized(
  authService: AuthService,
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshToken$.next(null);

    return authService.refreshAccessToken().pipe(
      switchMap((newToken: string) => {
        isRefreshing = false;
        refreshToken$.next(newToken);
        return next(addToken(req, newToken));
      }),
      catchError(error => {
        isRefreshing = false;
        refreshToken$.next(null);
        authService.logout();
        return throwError(() => error);
      })
    );
  }

  return refreshToken$.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap((token: string) => next(addToken(req, token)))
  );
}

function isAuthEndpoint(url: string): boolean {
  return url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout');
}