import { Routes } from '@angular/router';

import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component')
        .then(m => m.DashboardComponent),
    title: 'Dashboard — TaskFlow'
  },
  {
    path: 'signals',
    loadComponent: () =>
      import('./features/signals/signal-inspector.component')
        .then(m => m.SignalInspectorComponent),
    title: 'Signals — TaskFlow'
  },
  {
    path: 'tasks',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/tasks/tasks.routes')
        .then(m => m.TASK_ROUTES),
    data: { preload: true }
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { requiredRole: 'admin' },
    loadChildren: () =>
      import('./features/admin/admin.routes')
        .then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes')
        .then(m => m.AUTH_ROUTES)
  },
  {
    path: 'access-denied',
    loadComponent: () =>
      import('./shared/components/access-denied/access-denied.component')
        .then(m => m.AccessDeniedComponent),
    title: 'Access Denied — TaskFlow'
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component')
        .then(m => m.NotFoundComponent),
    title: 'Page Not Found — TaskFlow'
  }
];