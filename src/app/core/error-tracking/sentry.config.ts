import { environment } from '../../../environments/environment';

export function initSentry(): void {
  if (!environment.production || !environment.sentryDsn) {
    console.info('[Sentry] Disabled outside production or missing DSN.');
    return;
  }

  // Chapter 17 architecture note:
  // In a real production project, install @sentry/angular and replace this placeholder
  // with Sentry.init({ dsn, environment, release, integrations }).
  // The placeholder keeps the book demo compiling without adding an external dependency.
  console.info('[Sentry] Production error tracking would initialize here.', {
    dsn: environment.sentryDsn,
    environment: environment.name,
    release: environment.version
  });
}

export function addDeploymentBreadcrumb(message: string, data?: Record<string, unknown>): void {
  if (!environment.production) {
    console.debug('[Breadcrumb]', message, data ?? {});
  }
}