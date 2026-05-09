import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        return throwError(() =>
          new Error('Unable to reach the server. Check your connection and try again.')
        );
      }

      if (error.status === 401) {
        router.navigate(['/auth/login'], {
          queryParams: {
            returnUrl: router.url,
            reason: 'session-expired'
          }
        });

        return throwError(() => new Error('Session expired. Please log in again.'));
      }

      if (error.status === 403) {
        notificationService.error('You do not have permission to perform this action.');
        return throwError(() => new Error('Access denied.'));
      }

      if (error.status === 404) {
        return throwError(() => new Error('The requested resource was not found.'));
      }

      if (error.status === 422) {
        const message =
          error.error?.message ??
          error.error?.errors?.[0]?.message ??
          'Validation failed. Please check the submitted values.';

        return throwError(() => new Error(message));
      }

      if (error.status >= 500) {
        notificationService.error('A server error occurred. Please try again later.');
        return throwError(() => new Error('Server error. Please try again later.'));
      }

      return throwError(() =>
        new Error(error.error?.message ?? 'An unexpected HTTP error occurred.')
      );
    })
  );
};