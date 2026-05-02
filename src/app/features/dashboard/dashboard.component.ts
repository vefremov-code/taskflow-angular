import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { TaskService } from '../../core/services/task.service';
import { TaskStatus } from '../../core/models/task.model';

import { TaskCardComponent } from '../tasks/task-card/task-card.component';
import { TaskDetailComponent } from '../tasks/task-detail/task-detail.component';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    TaskCardComponent,
    TaskDetailComponent,
    ClickOutsideDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  readonly taskService = inject(TaskService);

  readonly today = new Date();

  readonly filterQuery = signal('');
  readonly statusFilter = signal<'all' | TaskStatus>('all');
  readonly priorityFilter = signal<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  readonly isFilterOpen = signal(false);

  readonly totalCount = this.taskService.totalCount;
  readonly inProgressCount = this.taskService.inProgressCount;
  readonly completedCount = this.taskService.doneCount;
  readonly criticalCount = this.taskService.blockedCount;

  readonly highlightQuery = computed(() => this.filterQuery().trim());

  readonly hasActiveFilter = computed(() =>
    this.filterQuery().trim().length > 0 ||
    this.statusFilter() !== 'all' ||
    this.priorityFilter() !== 'all'
  );

  readonly filteredTasks = computed(() => {
    const query = this.filterQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const priority = this.priorityFilter();

    return this.taskService.tasks().filter(task => {
      const matchesQuery =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.tags.some(tag => tag.toLowerCase().includes(query));

      const matchesStatus =
        status === 'all' || task.status === status;

      const matchesPriority =
        priority === 'all' || task.priority === priority;

      return matchesQuery && matchesStatus && matchesPriority;
    });
  });

  onFilterInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filterQuery.set(value);
  }

  onStatusFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'all' | TaskStatus;
    this.statusFilter.set(value);
  }

  onPriorityFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as
      | 'all'
      | 'critical'
      | 'high'
      | 'medium'
      | 'low';

    this.priorityFilter.set(value);
  }

  toggleFilter(): void {
    this.isFilterOpen.update(value => !value);
  }

  closeFilter(): void {
    this.isFilterOpen.set(false);
  }

  clearFilters(): void {
    this.filterQuery.set('');
    this.statusFilter.set('all');
    this.priorityFilter.set('all');
    this.closeFilter();
  }

  onTaskSelected(taskId: string): void {
    this.taskService.selectTask(taskId);
  }

  onStatusChanged(event: { taskId: string; status: TaskStatus }): void {
    this.taskService.updateStatus(event.taskId, event.status);
  }
}