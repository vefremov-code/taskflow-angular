import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, delay, filter, of, retry, tap } from 'rxjs';

import { TaskRealtimeEvent, TaskStatus } from '../models/task.model';
import { NotificationService } from './notification.service';
import { TaskService } from './task.service';

@Injectable({
  providedIn: 'root'
})
export class TaskRealtimeService {
  private readonly taskService = inject(TaskService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly incomingEvents = new Subject<TaskRealtimeEvent>();
  private readonly _connected = signal(false);
  private readonly _lastEvent = signal<TaskRealtimeEvent | null>(null);

  readonly connected = this._connected.asReadonly();
  readonly lastEvent = this._lastEvent.asReadonly();
  readonly connectionLabel = computed(() => this.connected() ? 'Connected' : 'Disconnected');

  connect(): void {
    if (this._connected()) {
      return;
    }

    this._connected.set(true);

    this.incomingEvents.pipe(
      filter(() => this._connected()),
      tap(event => this._lastEvent.set(event)),
      retry({ count: 2, delay: () => of(null).pipe(delay(500)) }),
      catchError(() => of(null)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(event => {
      if (event) {
        this.applyRealtimeEvent(event);
      }
    });

    this.notificationService.info('Realtime task stream connected');
  }

  disconnect(): void {
    this._connected.set(false);
    this.notificationService.info('Realtime task stream disconnected');
  }

  pushDemoStatusChange(): void {
    if (!this._connected()) {
      this.connect();
    }

    const tasks = this.taskService.tasks();
    const target = tasks[0];

    if (!target) {
      return;
    }

    const order: TaskStatus[] = ['todo', 'in-progress', 'done', 'blocked'];
    const nextStatus = order[(order.indexOf(target.status) + 1) % order.length];

    this.incomingEvents.next({
      type: 'task.status_changed',
      taskId: target.id,
      status: nextStatus
    });
  }

  pushDemoCreate(): void {
    if (!this._connected()) {
      this.connect();
    }

    const now = new Date();

    this.incomingEvents.next({
      type: 'task.created',
      task: {
        id: `realtime-${Date.now()}`,
        title: 'Realtime task update',
        description: 'Created by a simulated WebSocket event stream.',
        status: 'todo',
        priority: 'high',
        dueDate: new Date('2026-05-28'),
        tags: ['realtime', 'rxjs'],
        assigneeId: 'user-2',
        projectId: 'proj-1',
        createdAt: now,
        updatedAt: now
      }
    });
  }

  private applyRealtimeEvent(event: TaskRealtimeEvent): void {
    switch (event.type) {
      case 'task.created':
        this.taskService.addTaskToState(event.task);
        this.notificationService.success('Realtime event: task created');
        break;

      case 'task.updated':
        this.taskService.updateTaskInState(event.task);
        this.notificationService.info('Realtime event: task updated');
        break;

      case 'task.deleted':
        this.taskService.removeTaskFromState(event.taskId);
        this.notificationService.warning('Realtime event: task deleted');
        break;

      case 'task.status_changed':
        this.taskService.updateStatusInState(event.taskId, event.status);
        this.notificationService.info(`Realtime event: status changed to ${event.status}`);
        break;
    }
  }
}