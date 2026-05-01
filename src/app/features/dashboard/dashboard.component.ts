import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import {
  TaskPriority,
  TaskStatus
} from '../../core/models/task.model';
import { TaskService } from '../../core/services/task.service';
import { TaskCardComponent } from '../tasks/task-card/task-card.component';

type FilterableStatus = TaskStatus | 'all';
type FilterablePriority = TaskPriority | 'all';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink, TaskCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);

  readonly totalCount = this.taskService.totalCount;
  readonly completedCount = this.taskService.completedCount;
  readonly inProgressCount = this.taskService.inProgressCount;
  readonly criticalCount = this.taskService.criticalCount;

  filterQuery = signal('');
  statusFilter = signal<FilterableStatus>('all');
  priorityFilter = signal<FilterablePriority>('all');

  filteredTasks = computed(() =>
    this.taskService.filterTasks(
      this.filterQuery(),
      this.statusFilter(),
      this.priorityFilter()
    )
  );

  hasActiveFilter = computed(() =>
    this.filterQuery().trim() !== '' ||
    this.statusFilter() !== 'all' ||
    this.priorityFilter() !== 'all'
  );

  today = new Date();

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

  onTaskSelected(taskId: string): void {
    this.router.navigate(['/tasks', taskId]);
  }

  onStatusChanged(event: { taskId: string; status: TaskStatus }): void {
    this.taskService.updateStatus(event.taskId, event.status);
  }
}