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

export interface ApiTaskResponse {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string | null;
  projectId?: string | null;
  dueDate?: string | null;
  tags?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  projectId?: string;
  dueDate: string | null;
  tags: string[];
}

export type UpdateTaskDto = Partial<CreateTaskDto>;

// Backward-compatible names used by earlier Chapter 10/RxJS examples.
export type CreateTaskRequest = CreateTaskData;
export type UpdateTaskRequest = UpdateTaskData;

export type TaskRealtimeEvent =
  | { type: 'task.created'; task: Task }
  | { type: 'task.updated'; task: Task }
  | { type: 'task.deleted'; taskId: string }
  | { type: 'task.status_changed'; taskId: string; status: TaskStatus };