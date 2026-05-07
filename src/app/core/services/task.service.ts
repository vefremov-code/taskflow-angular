import { DestroyRef, computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';

import { cloneTasks } from '../data/initial-tasks';
import {
  CreateTaskData,
  Task,
  TaskStatus,
  UpdateTaskData
} from '../models/task.model';
import { HttpTaskService } from './http-task.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly notificationService = inject(NotificationService);
  private readonly httpTaskService = inject(HttpTaskService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _tasks = signal<Task[]>(cloneTasks());
  readonly tasks = this._tasks.asReadonly();

  private readonly _selectedTaskId = signal<string | null>(null);
  readonly selectedTaskId = this._selectedTaskId.asReadonly();

  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  private readonly _error = signal<string | null>(null);
  readonly error = this._error.asReadonly();

  private readonly _httpLoaded = signal(false);
  readonly httpLoaded = this._httpLoaded.asReadonly();

  readonly selectedTask = computed(() => {
    const id = this._selectedTaskId();

    if (!id) {
      return null;
    }

    return this._tasks().find(task => task.id === id) ?? null;
  });

  readonly hasSelection = computed(() => this._selectedTaskId() !== null);

  readonly totalCount = computed(() => this._tasks().length);

  readonly todoCount = computed(() =>
    this._tasks().filter(task => task.status === 'todo').length
  );

  readonly inProgressCount = computed(() =>
    this._tasks().filter(task => task.status === 'in-progress').length
  );

  readonly doneCount = computed(() =>
    this._tasks().filter(task => task.status === 'done').length
  );

  readonly blockedCount = computed(() =>
    this._tasks().filter(task => task.status === 'blocked').length
  );

  readonly completedCount = this.doneCount;

  readonly criticalCount = computed(() =>
    this._tasks().filter(task => task.priority === 'critical').length
  );

  readonly highPriorityCount = computed(() =>
    this._tasks().filter(task => task.priority === 'high').length
  );

  readonly overdueCount = computed(() => {
    const now = new Date();

    return this._tasks().filter(task =>
      task.dueDate !== null &&
      task.dueDate < now &&
      task.status !== 'done'
    ).length;
  });

  readonly hasOverdueTasks = computed(() => this.overdueCount() > 0);

  readonly completionRate = computed(() => {
    const total = this.totalCount();

    if (total === 0) {
      return 0;
    }

    return Math.round((this.doneCount() / total) * 100);
  });

  readonly statusSummary = computed(() => [
    {
      label: 'To Do',
      status: 'todo' as TaskStatus,
      count: this.todoCount()
    },
    {
      label: 'In Progress',
      status: 'in-progress' as TaskStatus,
      count: this.inProgressCount()
    },
    {
      label: 'Done',
      status: 'done' as TaskStatus,
      count: this.doneCount()
    },
    {
      label: 'Blocked',
      status: 'blocked' as TaskStatus,
      count: this.blockedCount()
    }
  ]);

  readonly signalSnapshot = computed(() => ({
    total: this.totalCount(),
    todo: this.todoCount(),
    inProgress: this.inProgressCount(),
    done: this.doneCount(),
    blocked: this.blockedCount(),
    critical: this.criticalCount(),
    overdue: this.overdueCount(),
    completionRate: this.completionRate(),
    loading: this.loading(),
    error: this.error(),
    httpLoaded: this.httpLoaded(),
    selectedTaskId: this.selectedTaskId(),
    selectedTaskTitle: this.selectedTask()?.title ?? 'None'
  }));

  loadTasksFromHttp(forceRefresh = false): void {
    this._loading.set(true);
    this._error.set(null);

    this.httpTaskService.loadTasks(forceRefresh).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this._loading.set(false))
    ).subscribe({
      next: tasks => {
        this._tasks.set(tasks);
        this._httpLoaded.set(true);
        this.notificationService.info('Tasks loaded through RxJS HTTP pipeline');
      },
      error: error => {
        this._error.set(this.getErrorMessage(error));
        this.notificationService.error('Unable to load tasks');
      }
    });
  }

  simulateNextHttpFailure(): void {
    this.httpTaskService.simulateNextFailure();
    this.notificationService.warning('The next simulated HTTP request will fail once');
  }

  selectTask(id: string): void {
    this._selectedTaskId.set(id);
  }

  selectNextTask(): void {
    const tasks = this._tasks();

    if (tasks.length === 0) {
      this.clearSelection();
      return;
    }

    const currentId = this._selectedTaskId();
    const currentIndex = tasks.findIndex(task => task.id === currentId);
    const nextIndex = currentIndex === -1
      ? 0
      : (currentIndex + 1) % tasks.length;

    this.selectTask(tasks[nextIndex].id);
  }

  clearSelection(): void {
    this._selectedTaskId.set(null);
  }

  getTaskById(id: string): Task | null {
    return this._tasks().find(task => task.id === id) ?? null;
  }

  getById(id: string): Task | null {
    return this.getTaskById(id);
  }

  titleExists(title: string, excludeTaskId?: string): boolean {
    const normalized = title.trim().toLowerCase();

    return this._tasks().some(task =>
      task.title.trim().toLowerCase() === normalized &&
      task.id !== excludeTaskId
    );
  }

  addTask(data: CreateTaskData): Task {
    const now = new Date();

    const task: Task = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };

    this.addTaskToState(task);
    this.notificationService.success('Task created successfully');

    return task;
  }

  createTaskRemote(data: CreateTaskData): Observable<Task> {
    const optimisticTask: Task = {
      ...data,
      id: `temp-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.addTaskToState(optimisticTask);

    return this.httpTaskService.createTask(data).pipe(
      tap(savedTask => {
        this._tasks.update(tasks =>
          tasks.map(task => task.id === optimisticTask.id ? savedTask : task)
        );
        this.selectTask(savedTask.id);
        this.notificationService.success('Task created through RxJS HTTP pipeline');
      }),
      catchError(error => {
        this.removeTaskFromState(optimisticTask.id, false);
        this._error.set(this.getErrorMessage(error));
        this.notificationService.error('Task creation failed and optimistic update was rolled back');
        return throwError(() => error);
      })
    );
  }

  addSignalDemoTask(): Task {
    const task = this.addTask({
      title: 'Review signal architecture',
      description: 'Trace writable signals, computed signals, and template consumers in TaskFlow.',
      status: 'todo',
      priority: 'critical',
      dueDate: new Date('2026-05-20'),
      tags: ['signals', 'architecture'],
      assigneeId: 'user-1',
      projectId: 'proj-1'
    });

    this.selectTask(task.id);
    return task;
  }

  updateTask(id: string, changes: UpdateTaskData): Task | null {
    const existing = this.getTaskById(id);

    if (!existing) {
      return null;
    }

    const updated: Task = {
      ...existing,
      ...changes,
      updatedAt: new Date()
    };

    this.updateTaskInState(updated);
    this.notificationService.success('Task updated successfully');

    return updated;
  }

  updateTaskRemote(id: string, changes: UpdateTaskData): Observable<Task> {
    const previous = this.getTaskById(id);

    if (!previous) {
      return throwError(() => new Error('Unable to update task. Task was not found.'));
    }

    const optimistic: Task = {
      ...previous,
      ...changes,
      updatedAt: new Date()
    };

    this.updateTaskInState(optimistic);

    return this.httpTaskService.updateTask(id, changes).pipe(
      tap(savedTask => {
        this.updateTaskInState(savedTask);
        this.notificationService.success('Task updated through RxJS HTTP pipeline');
      }),
      catchError(error => {
        this.updateTaskInState(previous);
        this._error.set(this.getErrorMessage(error));
        this.notificationService.error('Task update failed and optimistic update was rolled back');
        return throwError(() => error);
      })
    );
  }

  updateStatus(taskId: string, status: TaskStatus): void {
    const task = this._tasks().find(item => item.id === taskId);

    if (!task) {
      return;
    }

    this.updateStatusInState(taskId, status);

    if (status === 'done') {
      this.notificationService.success(`${task.title} marked as complete`);
    }

    if (status === 'blocked') {
      this.notificationService.error(
        `${task.title} is blocked — review required`,
        8000
      );
    }
  }

  updateStatusRemote(taskId: string, status: TaskStatus): Observable<Task> {
    const previous = this.getTaskById(taskId);

    if (!previous) {
      return throwError(() => new Error('Unable to update status. Task was not found.'));
    }

    this.updateStatusInState(taskId, status);

    return this.httpTaskService.updateTask(taskId, { status }).pipe(
      tap(savedTask => {
        this.updateTaskInState(savedTask);
        if (status === 'done') {
          this.notificationService.success(`${savedTask.title} marked complete through RxJS`);
        }
      }),
      catchError(error => {
        this.updateTaskInState(previous);
        this.notificationService.error('Status update failed and was rolled back');
        return throwError(() => error);
      })
    );
  }

  cycleFirstTaskStatus(): void {
    const firstTask = this._tasks()[0];

    if (!firstTask) {
      return;
    }

    const statusOrder: TaskStatus[] = ['todo', 'in-progress', 'done', 'blocked'];
    const currentIndex = statusOrder.indexOf(firstTask.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    this.updateStatus(firstTask.id, nextStatus);
  }

  deleteTask(id: string): void {
    const task = this.getTaskById(id);

    this.removeTaskFromState(id);

    if (task) {
      this.notificationService.success(`${task.title} deleted`);
    }
  }

  addTaskToState(task: Task): void {
    this._tasks.update(tasks =>
      tasks.some(item => item.id === task.id)
        ? tasks
        : [...tasks, this.cloneTask(task)]
    );
  }

  updateTaskInState(updated: Task): void {
    this._tasks.update(tasks =>
      tasks.map(task => task.id === updated.id ? this.cloneTask(updated) : task)
    );
  }

  removeTaskFromState(taskId: string, showNotification = true): void {
    this._tasks.update(tasks => tasks.filter(item => item.id !== taskId));

    if (this._selectedTaskId() === taskId) {
      this.clearSelection();
    }

    if (showNotification) {
      this.notificationService.info('Task removed from signal state');
    }
  }

  updateStatusInState(taskId: string, status: TaskStatus): void {
    this._tasks.update(tasks =>
      tasks.map(item =>
        item.id === taskId
          ? {
              ...item,
              status,
              updatedAt: new Date()
            }
          : item
      )
    );
  }

  resetSignalDemoState(): void {
    this._tasks.set(cloneTasks());
    this.clearSelection();
    this._error.set(null);
    this._httpLoaded.set(false);
    this.notificationService.info('Signal demo state reset');
  }

  private cloneTask(task: Task): Task {
    return {
      ...task,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      tags: [...task.tags]
    };
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error
      ? error.message
      : 'Unknown task service error.';
  }
}