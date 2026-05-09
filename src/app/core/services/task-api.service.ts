import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Observable,
  catchError,
  defer,
  map,
  retry,
  shareReplay,
  throwError,
  timer
} from 'rxjs';

import {
  ApiTaskResponse,
  CreateTaskData,
  CreateTaskDto,
  Task,
  TaskPriority,
  TaskStatus,
  UpdateTaskData,
  UpdateTaskDto
} from '../models/task.model';
import { API_BASE_URL } from '../tokens/api.tokens';

export interface TaskQueryFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  query?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private allTasksCache$?: Observable<Task[]>;
  private failNextRequest = false;

  getAll(forceRefresh = false): Observable<Task[]> {
    if (!this.allTasksCache$ || forceRefresh) {
      this.allTasksCache$ = this.withOptionalDemoFailure(
        this.http.get<ApiTaskResponse[]>(`${this.baseUrl}/tasks`).pipe(
          map(items => items.map(item => this.toTask(item))),
          retry({
            count: 2,
            delay: (_error, retryCount) => timer(retryCount * 400)
          }),
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError(error => {
            this.invalidateCache();
            return throwError(() => error);
          })
        )
      );
    }

    return this.allTasksCache$;
  }

  loadTasks(forceRefresh = false): Observable<Task[]> {
    return this.getAll(forceRefresh);
  }

  searchTasks(query: string): Observable<Task[]> {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return this.getAll();
    }

    const params = new HttpParams().set('q', normalized);

    return this.http.get<ApiTaskResponse[]>(`${this.baseUrl}/tasks/search`, { params }).pipe(
      map(items => items.map(item => this.toTask(item))),
      catchError(() =>
        this.getAll().pipe(
          map(tasks => tasks.filter(task =>
            task.title.toLowerCase().includes(normalized) ||
            task.description.toLowerCase().includes(normalized) ||
            task.tags.some(tag => tag.toLowerCase().includes(normalized))
          ))
        )
      )
    );
  }

  getTaskById(id: string): Observable<Task> {
    return this.http.get<ApiTaskResponse>(`${this.baseUrl}/tasks/${id}`).pipe(
      map(item => this.toTask(item))
    );
  }

  createTask(data: CreateTaskData): Observable<Task> {
    return this.http.post<ApiTaskResponse>(`${this.baseUrl}/tasks`, this.toCreateDto(data)).pipe(
      map(item => this.toTask(item)),
      map(task => {
        this.invalidateCache();
        return task;
      })
    );
  }

  updateTask(id: string, changes: UpdateTaskData): Observable<Task> {
    return this.http.patch<ApiTaskResponse>(`${this.baseUrl}/tasks/${id}`, this.toUpdateDto(changes)).pipe(
      map(item => this.toTask(item)),
      map(task => {
        this.invalidateCache();
        return task;
      })
    );
  }

  updateStatus(id: string, status: TaskStatus): Observable<Task> {
    return this.updateTask(id, { status });
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tasks/${id}`).pipe(
      map(() => {
        this.invalidateCache();
        return void 0;
      })
    );
  }

  resetServerState(): Observable<Task[]> {
    this.invalidateCache();
    return this.http.post<ApiTaskResponse[]>(`${this.baseUrl}/tasks/reset`, {}).pipe(
      map(items => items.map(item => this.toTask(item)))
    );
  }

  invalidateCache(): void {
    this.allTasksCache$ = undefined;
  }

  simulateNextFailure(): void {
    this.failNextRequest = true;
  }

  private toTask(apiTask: ApiTaskResponse): Task {
    return {
      id: apiTask.id,
      title: apiTask.title,
      description: apiTask.description ?? '',
      status: apiTask.status,
      priority: apiTask.priority,
      assigneeId: apiTask.assigneeId ?? undefined,
      projectId: apiTask.projectId ?? undefined,
      dueDate: apiTask.dueDate ? new Date(apiTask.dueDate) : null,
      tags: apiTask.tags ?? [],
      createdAt: new Date(apiTask.createdAt),
      updatedAt: new Date(apiTask.updatedAt)
    };
  }

  private toCreateDto(data: CreateTaskData): CreateTaskDto {
    return {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assigneeId: data.assigneeId,
      projectId: data.projectId,
      dueDate: data.dueDate ? data.dueDate.toISOString() : null,
      tags: [...data.tags]
    };
  }

  private toUpdateDto(changes: UpdateTaskData): UpdateTaskDto {
    return {
      title: changes.title,
      description: changes.description,
      status: changes.status,
      priority: changes.priority,
      assigneeId: changes.assigneeId,
      projectId: changes.projectId,
      dueDate: changes.dueDate instanceof Date
        ? changes.dueDate.toISOString()
        : changes.dueDate === null
          ? null
          : undefined,
      tags: changes.tags ? [...changes.tags] : undefined
    };
  }

  private withOptionalDemoFailure<T>(source$: Observable<T>): Observable<T> {
    return defer(() => {
      if (this.failNextRequest) {
        this.failNextRequest = false;
        return throwError(() => new Error('Simulated API failure. Retry path executed.'));
      }

      return source$;
    });
  }
}