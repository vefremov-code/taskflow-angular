export type TaskStatus = 'todo' | 'in-progress' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  projectId: string;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  taskIds: string[];
  color: string;
  createdAt: Date;
}