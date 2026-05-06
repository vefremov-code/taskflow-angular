import { Routes } from '@angular/router';

import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';
import { taskResolver } from '../../core/resolvers/task.resolver';

export const TASK_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./task-list/task-list-page.component')
        .then(m => m.TaskListPageComponent),
    title: 'Tasks — TaskFlow'
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./task-form/task-form-page.component')
        .then(m => m.TaskFormPageComponent),
    canDeactivate: [unsavedChangesGuard],
    title: 'New Task — TaskFlow'
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./task-detail/task-detail-page.component')
        .then(m => m.TaskDetailPageComponent),
    resolve: { task: taskResolver },
    title: 'Task Detail — TaskFlow'
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./task-form/task-form-page.component')
        .then(m => m.TaskFormPageComponent),
    resolve: { task: taskResolver },
    canDeactivate: [unsavedChangesGuard],
    title: 'Edit Task — TaskFlow'
  }
];