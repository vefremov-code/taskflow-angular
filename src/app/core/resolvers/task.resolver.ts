import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';

import { Task } from '../models/task.model';
import { TaskService } from '../services/task.service';

export const taskResolver: ResolveFn<Task> = route => {
  const taskService = inject(TaskService);
  const router = inject(Router);

  const id = route.paramMap.get('id');
  const task = id ? taskService.getTaskById(id) : null;

  if (!id || !task) {
    router.navigate(['/tasks']);
    return null as unknown as Task;
  }

  taskService.selectTask(id);
  return task;
};