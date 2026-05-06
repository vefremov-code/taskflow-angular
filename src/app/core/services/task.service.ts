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

function cloneInitialTasks(): Task[] {
  return INITIAL_TASKS.map(task => ({
    ...task,
    dueDate: task.dueDate ? new Date(task.dueDate) : null,
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt),
    tags: [...task.tags]
  }));
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private notificationService = inject(NotificationService);

  private _tasks = signal<Task[]>(cloneInitialTasks());
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
    selectedTaskId: this.selectedTaskId(),
    selectedTaskTitle: this.selectedTask()?.title ?? 'None'
  }));

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

    this._tasks.update(tasks => [...tasks, task]);
    this.notificationService.success('Task created successfully');

    return task;
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

    this._tasks.update(tasks => tasks.filter(item => item.id !== id));

    if (this._selectedTaskId() === id) {
      this.clearSelection();
    }

    if (task) {
      this.notificationService.success(`${task.title} deleted`);
    }
  }

  resetSignalDemoState(): void {
    this._tasks.set(cloneInitialTasks());
    this.clearSelection();
    this.notificationService.info('Signal demo state reset');
  }
}