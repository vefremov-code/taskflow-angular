import { Injectable } from '@angular/core';
import {
  Observable,
  defer,
  delay,
  map,
  of,
  retry,
  shareReplay,
  tap,
  throwError,
  timer
} from 'rxjs';

import { cloneTasks } from '../data/initial-tasks';
import {
  CreateTaskRequest,
  Task,
  UpdateTaskRequest
} from '../models/task.model';

function createServerError(message: string): Error {
  return new Error(message);
}

@Injectable({
  providedIn: 'root'
})
export class HttpTaskService {
  private serverTasks: Task[] = cloneTasks();
  private loadTasksCache$?: Observable<Task[]>;
  private failNextRequest = false;

  /**
   * Demo helper for Chapter 10.
   * The next request fails once, allowing the retry/error path to be tested.
   */
  simulateNextFailure(): void {
    this.failNextRequest = true;
  }

  loadTasks(forceRefresh = false): Observable<Task[]> {
    if (!this.loadTasksCache$ || forceRefresh) {
      this.loadTasksCache$ = this.simulateHttp(() => cloneTasks(this.serverTasks)).pipe(
        retry({
          count: 2,
          delay: (_error, retryCount) => timer(retryCount * 400)
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.loadTasksCache$;
  }

  searchTasks(query: string): Observable<Task[]> {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return of([]);
    }

    return this.simulateHttp(() =>
      cloneTasks(this.serverTasks).filter(task =>
        task.title.toLowerCase().includes(normalized) ||
        task.description.toLowerCase().includes(normalized) ||
        task.tags.some(tag => tag.toLowerCase().includes(normalized))
      )
    ).pipe(
      retry({
        count: 1,
        delay: () => timer(300)
      })
    );
  }

  getTaskById(id: string): Observable<Task> {
    return this.simulateHttp(() => {
      const task = this.serverTasks.find(item => item.id === id);

      if (!task) {
        throw createServerError(`Task ${id} was not found.`);
      }

      return cloneTasks([task])[0];
    });
  }

  createTask(data: CreateTaskRequest): Observable<Task> {
    return this.simulateHttp(() => {
      const now = new Date();
      const task: Task = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now
      };

      this.serverTasks = [...this.serverTasks, task];
      this.clearCache();

      return cloneTasks([task])[0];
    });
  }

  updateTask(id: string, changes: UpdateTaskRequest): Observable<Task> {
    return this.simulateHttp(() => {
      const existing = this.serverTasks.find(task => task.id === id);

      if (!existing) {
        throw createServerError(`Task ${id} was not found.`);
      }

      const updated: Task = {
        ...existing,
        ...changes,
        updatedAt: new Date()
      };

      this.serverTasks = this.serverTasks.map(task =>
        task.id === id ? updated : task
      );
      this.clearCache();

      return cloneTasks([updated])[0];
    });
  }

  deleteTask(id: string): Observable<void> {
    return this.simulateHttp(() => {
      this.serverTasks = this.serverTasks.filter(task => task.id !== id);
      this.clearCache();
    });
  }

  resetServerState(): Observable<Task[]> {
    return this.simulateHttp(() => {
      this.serverTasks = cloneTasks();
      this.clearCache();
      return cloneTasks(this.serverTasks);
    });
  }

  private clearCache(): void {
    this.loadTasksCache$ = undefined;
  }

  private simulateHttp<T>(factory: () => T): Observable<T> {
    return defer(() => {
      if (this.failNextRequest) {
        this.failNextRequest = false;
        return throwError(() => createServerError('Simulated network failure. Retry path executed.'));
      }

      try {
        return of(factory()).pipe(delay(350));
      } catch (error) {
        return throwError(() => error);
      }
    }).pipe(
      map(value => value),
      tap(() => undefined)
    );
  }
}