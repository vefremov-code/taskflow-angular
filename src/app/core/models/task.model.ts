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