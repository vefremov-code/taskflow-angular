import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { initSentry } from './app/core/error-tracking/sentry.config';

initSentry();

bootstrapApplication(AppComponent, appConfig)
  .catch(error => console.error(error));