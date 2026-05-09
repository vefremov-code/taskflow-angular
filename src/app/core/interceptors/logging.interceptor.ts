import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import { tap } from 'rxjs';

import { environment } from '../../../environments/environment';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isDevMode() || !environment.logHttpRequests) {
    return next(req);
  }

  const startedAt = Date.now();
  const requestId = Math.random().toString(36).slice(2, 8);

  console.groupCollapsed(`[HTTP:${requestId}] ${req.method} ${req.urlWithParams}`);
  console.log('Headers:', req.headers.keys());
  if (req.body) {
    console.log('Body:', req.body);
  }
  console.groupEnd();

  return next(req).pipe(
    tap({
      next: event => {
        if (event instanceof HttpResponse) {
          const duration = Date.now() - startedAt;
          console.log(
            `[HTTP:${requestId}] ${event.status} ${req.method} ${req.url} (${duration}ms)`
          );
        }
      },
      error: error => {
        const duration = Date.now() - startedAt;
        console.error(
          `[HTTP:${requestId}] ERROR ${req.method} ${req.url} (${duration}ms)`,
          error.message
        );
      }
    })
  );
};