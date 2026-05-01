import { Injectable, computed, signal } from '@angular/core';
import { Task, TaskPriority, TaskStatus } from '../models/task.model';

const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Design system audit',
    description: 'Review all UI components for accessibility compliance',
    status: 'in-progress',
    priority: 'high',
    assigneeId: 'user-1',
    projectId: 'proj-1',
    dueDate: new Date(2026, 11, 20),
    createdAt: new Date(2026, 10, 1),
    updatedAt: new Date(2026, 11, 10),
    tags: ['design', 'a11y']
  },
  {
    id: '2',
    title: 'Set up CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing and deployment',
    status: 'todo',
    priority: 'critical',
    assigneeId: 'user-2',
    projectId: 'proj-1',
    dueDate: new Date(2026, 11, 15),
    createdAt: new Date(2026, 11, 1),
    updatedAt: new Date(2026, 11, 1),
    tags: ['devops', 'infrastructure']
  },
  {
    id: '3',
    title: 'Write unit tests for TaskService',
    description: 'Achieve 80% coverage on the core task service',
    status: 'done',
    priority: 'medium',
    assigneeId: 'user-1',
    projectId: 'proj-2',
    dueDate: null,
    createdAt: new Date(2026, 10, 20),
    updatedAt: new Date(2026, 11, 5),
    tags: ['testing']
  }
];

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly _tasks = signal<Task[]>(INITIAL_TASKS);

  readonly tasks = this._tasks.asReadonly();

  readonly totalCount = computed(() => this._tasks().length);

  readonly completedCount = computed(() =>
    this._tasks().filter(task => task.status === 'done').length
  );

  readonly inProgressCount = computed(() =>
    this._tasks().filter(task => task.status === 'in-progress').length
  );

  readonly criticalCount = computed(() =>
    this._tasks().filter(task => task.priority === 'critical').length
  );

  readonly overdueCount = computed(() => {
    const now = new Date();

    return this._tasks().filter(task =>
      task.dueDate !== null &&
      task.dueDate < now &&
      task.status !== 'done'
    ).length;
  });

  getById(id: string): Task | undefined {
    return this._tasks().find(task => task.id === id);
  }

  filterTasks(
    query: string,
    status: TaskStatus | 'all',
    priority: TaskPriority | 'all'
  ): Task[] {
    const normalizedQuery = query.toLowerCase().trim();

    return this._tasks().filter(task => {
      const matchesQuery =
        !normalizedQuery ||
        task.title.toLowerCase().includes(normalizedQuery) ||
        task.description.toLowerCase().includes(normalizedQuery) ||
        task.tags.some(tag => tag.toLowerCase().includes(normalizedQuery));

      const matchesStatus =
        status === 'all' || task.status === status;

      const matchesPriority =
        priority === 'all' || task.priority === priority;

      return matchesQuery && matchesStatus && matchesPriority;
    });
  }

  addTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const newTask: Task = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this._tasks.update(tasks => [...tasks, newTask]);

    return newTask;
  }

  updateTask(
    id: string,
    changes: Partial<Omit<Task, 'id' | 'createdAt'>>
  ): void {
    this._tasks.update(tasks =>
      tasks.map(task =>
        task.id === id
          ? { ...task, ...changes, updatedAt: new Date() }
          : task
      )
    );
  }

  updateStatus(taskId: string, status: TaskStatus): void {
    this.updateTask(taskId, { status });
  }

  deleteTask(id: string): void {
    this._tasks.update(tasks =>
      tasks.filter(task => task.id !== id)
    );
  }

  setTasks(tasks: Task[]): void {
    this._tasks.set(tasks);
  }
}