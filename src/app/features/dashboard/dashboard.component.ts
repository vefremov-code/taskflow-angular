import { ChangeDetectionStrategy, Component, computed, signal, inject  } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Task, TaskStatus, TaskPriority  } from '../../core/models/task.model';
import { TaskCardComponent } from '../tasks/task-card/task-card.component';

type FilterableStatus = TaskStatus | 'all';
type FilterablePriority = TaskPriority | 'all';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [TaskCardComponent, DatePipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
    private router = inject(Router);
  tasks = signal<Task[]>([
    {
      id: '1',
      title: 'Design system audit',
      description: 'Review all UI components for accessibility compliance',
      status: 'in-progress',
      priority: 'high',
      assigneeId: 'user-1',
      projectId: 'proj-1',
      dueDate: new Date(2024, 11, 20),
      createdAt: new Date(2024, 10, 1),
      updatedAt: new Date(2024, 11, 10),
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
      dueDate: new Date(2024, 11, 15),
      createdAt: new Date(2024, 11, 1),
      updatedAt: new Date(2024, 11, 1),
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
      createdAt: new Date(2024, 10, 20),
      updatedAt: new Date(2024, 11, 5),
      tags: ['testing']
    }
  ]);

  filterQuery = signal('');
  statusFilter = signal<FilterableStatus>('all');
  priorityFilter = signal<FilterablePriority>('all');

  filteredTasks = computed(() => {
    const query = this.filterQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const priority = this.priorityFilter();

    return this.tasks().filter(task => {
      const matchesQuery =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.tags.some(tag => tag.toLowerCase().includes(query));

      const matchesStatus = status === 'all' || task.status === status;
      const matchesPriority = priority === 'all' || task.priority === priority;

      return matchesQuery && matchesStatus && matchesPriority;
    });
  });


  totalTasks = computed(() => this.tasks().length);
  completedTasks = computed(() =>
    this.tasks().filter(t => t.status === 'done').length
  );
  inProgressTasks = computed(() =>
    this.tasks().filter(t => t.status === 'in-progress').length
  );
  criticalTasks = computed(() =>
    this.tasks().filter(t => t.priority === 'critical').length
  );

  hasActiveFilter = computed(() =>
    this.filterQuery().trim() !== '' ||
    this.statusFilter() !== 'all' ||
    this.priorityFilter() !== 'all'
  );


  today = new Date();

  onTaskSelected(taskId: string): void {
    this.router.navigate(['/tasks', taskId]);
  }

  onFilterInput(event: Event): void {
    this.filterQuery.set((event.target as HTMLInputElement).value);
  }

  onStatusFilterChange(event: Event): void {
    this.statusFilter.set(
      (event.target as HTMLSelectElement).value as FilterableStatus
    );
  }

  onPriorityFilterChange(event: Event): void {
    this.priorityFilter.set(
      (event.target as HTMLSelectElement).value as FilterablePriority
    );
  }

  clearFilters(): void {
    this.filterQuery.set('');
    this.statusFilter.set('all');
    this.priorityFilter.set('all');
  }

  onStatusChanged(event: { taskId: string; status: TaskStatus }): void {
    this.tasks.update(tasks =>
      tasks.map(task =>
        task.id === event.taskId
          ? { ...task, status: event.status }
          : task
      )
    );
  }

}