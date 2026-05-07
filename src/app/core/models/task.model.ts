export type TaskStatus =
  | 'todo'
  | 'in-progress'
  | 'done'
  | 'blocked';

export type TaskPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export interface Task {
  id: string;

  title: string;
  description: string;

  status: TaskStatus;
  priority: TaskPriority;

  assigneeId?: string;
  projectId?: string;

  dueDate: Date | null;

  tags: string[];

  createdAt: Date;
  updatedAt: Date;
}

export type CreateTaskData = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTaskData = Partial<CreateTaskData>;

// Chapter 10 names used by the simulated HTTP layer.
// They intentionally mirror the application-level types so the chapter can
// focus on architecture rather than DTO mapping.
export type CreateTaskRequest = CreateTaskData;
export type UpdateTaskRequest = UpdateTaskData;

export type TaskRealtimeEvent =
  | { type: 'task.created'; task: Task }
  | { type: 'task.updated'; task: Task }
  | { type: 'task.deleted'; taskId: string }
  | { type: 'task.status_changed'; taskId: string; status: TaskStatus };