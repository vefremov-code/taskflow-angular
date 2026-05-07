import { Task } from '../models/task.model';

export const INITIAL_TASKS: Task[] = [
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

export function cloneTasks(tasks: Task[] = INITIAL_TASKS): Task[] {
  return tasks.map(task => ({
    ...task,
    dueDate: task.dueDate ? new Date(task.dueDate) : null,
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt),
    tags: [...task.tags]
  }));
}