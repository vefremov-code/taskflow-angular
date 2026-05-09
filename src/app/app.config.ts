import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  PreloadAllModules,
  provideRouter,
  withComponentInputBinding,
  withPreloading
} from '@angular/router';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loggingInterceptor } from './core/interceptors/logging.interceptor';
import { API_BASE_URL } from './core/tokens/api.tokens';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
    provideRouter(
      routes,
      withComponentInputBinding(),
      withPreloading(PreloadAllModules)
    ),
    provideHttpClient(
      withInterceptors([
        loggingInterceptor,
        authInterceptor,
        errorInterceptor
      ])
    )
  ]
};