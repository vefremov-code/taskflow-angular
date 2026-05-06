import { computed, inject, Injectable, signal } from '@angular/core';
import { NotificationService } from './notification.service';
import {
  CreateTaskData,
  Task,
  TaskStatus,
  UpdateTaskData
} from '../models/task.model';

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Design dashboard layout',
    description: 'Create the main dashboard layout for TaskFlow.',
    status: 'in-progress',
    priority: 'high',
    dueDate: new Date('2026-05-10'),
    tags: ['ui', 'dashboard'],
    createdAt: new Date('2026-04-20'),
    updatedAt: new Date('2026-04-22')
  },
  {
    id: 'task-2',
    title: 'Build reusable task card',
    description: 'Create a presentational task card component.',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date('2026-05-15'),
    tags: ['component', 'shared'],
    createdAt: new Date('2026-04-21'),
    updatedAt: new Date('2026-04-21')
  },
  {
    id: 'task-3',
    title: 'Add status filtering',
    description: 'Allow users to filter tasks by status.',
    status: 'blocked',
    priority: 'high',
    dueDate: new Date('2026-05-05'),
    tags: ['filter', 'state'],
    createdAt: new Date('2026-04-23'),
    updatedAt: new Date('2026-04-25')
  }
];

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private notificationService = inject(NotificationService);

  private _tasks = signal<Task[]>(INITIAL_TASKS);
  readonly tasks = this._tasks.asReadonly();

  private _selectedTaskId = signal<string | null>(null);
  readonly selectedTaskId = this._selectedTaskId.asReadonly();

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

  selectTask(id: string): void {
    this._selectedTaskId.set(id);
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

    this._tasks.update(tasks => [...tasks, task]);
    this.notificationService.success('Task created successfully');

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

    this._tasks.update(tasks =>
      tasks.map(task => task.id === id ? updated : task)
    );

    this.notificationService.success('Task updated successfully');

    return updated;
  }

  updateStatus(taskId: string, status: TaskStatus): void {
    const task = this._tasks().find(item => item.id === taskId);

    if (!task) {
      return;
    }

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

  deleteTask(id: string): void {
    const task = this.getTaskById(id);

    this._tasks.update(tasks => tasks.filter(item => item.id !== id));

    if (this._selectedTaskId() === id) {
      this.clearSelection();
    }

    if (task) {
      this.notificationService.success(`${task.title} deleted`);
    }
  }
}