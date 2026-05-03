import { Routes } from '@angular/router';

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
    path: 'tasks/new',
    loadComponent: () =>
      import('./features/tasks/task-form/task-form.component')
        .then(m => m.TaskFormComponent),
    title: 'New Task — TaskFlow'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];