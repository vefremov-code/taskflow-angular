export type TaskStatus =
  | 'todo'
  | 'in-progress'
  | 'done'
  | 'blocked';

export type TaskPriority =
  | 'low'
  | 'medium'
  | 'high';

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