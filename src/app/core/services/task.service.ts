import { DestroyRef, computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';

import {
  CreateTaskData,
  Task,
  TaskStatus,
  UpdateTaskData
} from '../models/task.model';
import { NotificationService } from './notification.service';
import { TaskApiService } from './task-api.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly notificationService = inject(NotificationService);
  private readonly taskApiService = inject(TaskApiService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _tasks = signal<Task[]>([]);
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

  constructor() {
    queueMicrotask(() => this.loadTasks());
  }

  loadTasks(forceRefresh = false): void {
    if (this._loading()) {
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.taskApiService.getAll(forceRefresh).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this._loading.set(false))
    ).subscribe({
      next: tasks => {
        this._tasks.set(tasks.map(task => this.cloneTask(task)));
        this._httpLoaded.set(true);
      },
      error: error => {
        this._error.set(this.getErrorMessage(error));
        this.notificationService.error('Unable to load tasks from the API');
      }
    });
  }

  loadTasksFromHttp(forceRefresh = false): void {
    this.loadTasks(forceRefresh);
  }

  simulateNextHttpFailure(): void {
    this.taskApiService.simulateNextFailure();
    this.notificationService.warning('The next API request will fail once');
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
    const optimisticTask = this.createOptimisticTask(data);

    this.addTaskToState(optimisticTask);
    this.createTaskRemote(data).subscribe({
      error: () => undefined
    });

    return optimisticTask;
  }

  createTaskRemote(data: CreateTaskData): Observable<Task> {
    const optimisticTask = this.createOptimisticTask(data);

    this.addTaskToState(optimisticTask);

    return this.taskApiService.createTask(data).pipe(
      tap(savedTask => {
        this._tasks.update(tasks =>
          tasks.map(task => task.id === optimisticTask.id ? this.cloneTask(savedTask) : task)
        );
        this.selectTask(savedTask.id);
        this.notificationService.success('Task created through the API');
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
    const task = this.createOptimisticTask({
      title: 'Review signal architecture',
      description: 'Trace writable signals, computed signals, and template consumers in TaskFlow.',
      status: 'todo',
      priority: 'critical',
      dueDate: new Date('2026-05-20'),
      tags: ['signals', 'architecture'],
      assigneeId: 'user-1',
      projectId: 'proj-1'
    });

    this.addTaskToState(task);
    this.selectTask(task.id);
    this.notificationService.success('Signal demo task added locally');

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
    this.updateTaskRemote(id, changes).subscribe({
      error: () => undefined
    });

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

    return this.taskApiService.updateTask(id, changes).pipe(
      tap(savedTask => {
        this.updateTaskInState(savedTask);
        this.notificationService.success('Task updated through the API');
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
    this.updateStatusRemote(taskId, status).subscribe({
      error: () => undefined
    });
  }

  updateStatusRemote(taskId: string, status: TaskStatus): Observable<Task> {
    const previous = this.getTaskById(taskId);

    if (!previous) {
      return throwError(() => new Error('Unable to update status. Task was not found.'));
    }

    this.updateStatusInState(taskId, status);

    if (status === 'done') {
      this.notificationService.success(`${previous.title} marked as complete`);
    }

    if (status === 'blocked') {
      this.notificationService.error(
        `${previous.title} is blocked — review required`,
        8000
      );
    }

    return this.taskApiService.updateStatus(taskId, status).pipe(
      tap(savedTask => this.updateTaskInState(savedTask)),
      catchError(error => {
        this.updateTaskInState(previous);
        this._error.set(this.getErrorMessage(error));
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

    if (!task) {
      return;
    }

    this.removeTaskFromState(id, false);

    this.taskApiService.deleteTask(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.notificationService.success(`${task.title} deleted through the API`),
      error: error => {
        this.addTaskToState(task);
        this._error.set(this.getErrorMessage(error));
        this.notificationService.error('Delete failed and the task was restored');
      }
    });
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
    this._tasks.set([]);
    this.clearSelection();
    this._error.set(null);
    this._httpLoaded.set(false);
    this.taskApiService.invalidateCache();
    this.loadTasks(true);
    this.notificationService.info('Signal demo state reset from API');
  }

  private createOptimisticTask(data: CreateTaskData): Task {
    const now = new Date();

    return {
      ...data,
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
      updatedAt: now
    };
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