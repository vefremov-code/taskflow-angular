import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { TaskPriority, TaskStatus } from '../../../core/models/task.model';
import { TaskService } from '../../../core/services/task.service';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'app-task-list-page',
  standalone: true,
  imports: [DatePipe, RouterLink, TaskCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tasks-page">
      <header class="tasks-header">
        <div>
          <p class="eyebrow">Tasks Feature</p>
          <h1>All Tasks</h1>
          <p class="muted">This route is lazy loaded from the tasks feature.</p>
        </div>

        <div class="header-actions">
          <a class="btn-ghost" routerLink="/dashboard">Dashboard</a>
          <a class="btn-primary" routerLink="/tasks/new">+ New Task</a>
        </div>
      </header>

      <section class="summary-cards" aria-label="Task summary">
        <div class="card">
          <span class="card-number">{{ taskService.totalCount() }}</span>
          <span class="card-label">Total</span>
        </div>
        <div class="card">
          <span class="card-number">{{ taskService.inProgressCount() }}</span>
          <span class="card-label">In Progress</span>
        </div>
        <div class="card">
          <span class="card-number">{{ taskService.doneCount() }}</span>
          <span class="card-label">Done</span>
        </div>
        <div class="card">
          <span class="card-number">{{ taskService.blockedCount() }}</span>
          <span class="card-label">Blocked</span>
        </div>
      </section>

      <div class="filter-bar" role="search" aria-label="Filter tasks">
        <input
          type="search"
          placeholder="Search tasks..."
          [value]="filterQuery()"
          (input)="onFilterInput($event)"
        />

        <select
          [value]="statusFilter()"
          (change)="onStatusFilterChange($event)"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
          <option value="blocked">Blocked</option>
        </select>

        <select
          [value]="priorityFilter()"
          (change)="onPriorityFilterChange($event)"
          aria-label="Filter by priority"
        >
          <option value="all">All priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <section class="task-section">
        <h2>
          Routed Task List
          <span class="filter-count">({{ filteredTasks().length }} / {{ taskService.totalCount() }})</span>
        </h2>

        @if (filteredTasks().length === 0) {
          <div class="empty-state">
            <p>No tasks found.</p>
          </div>
        } @else {
          <div class="task-list" role="list">
            @for (task of filteredTasks(); track task.id) {
              <div class="task-list-item">
                <app-task-card
                  [task]="task"
                  [isSelected]="task.id === taskService.selectedTaskId()"
                  [highlightTerm]="filterQuery()"
                  (taskSelected)="openTask($event)"
                  (statusChanged)="onStatusChanged($event)"
                />

                <div class="route-actions">
                  <a [routerLink]="['/tasks', task.id]">View routed detail</a>
                  <a [routerLink]="['/tasks', task.id, 'edit']">Edit</a>
                </div>
              </div>
            }
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .tasks-page {
      max-width: 1100px;
      margin: 0 auto;
      padding: 24px;
    }

    .tasks-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
    }

    .tasks-header h1 {
      margin: 0 0 6px;
    }

    .eyebrow {
      margin: 0 0 4px;
      color: #2563eb;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.75rem;
    }

    .muted {
      margin: 0;
      color: #64748b;
    }

    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .card {
      padding: 16px;
      border-radius: 12px;
      background: #f8fafc;
      display: grid;
      gap: 6px;
    }

    .card-number {
      font-size: 2rem;
      font-weight: 700;
    }

    .card-label,
    .filter-count {
      color: #64748b;
    }

    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      margin-bottom: 24px;
      padding: 16px;
      border-radius: 12px;
      background: #f8fafc;
    }

    .filter-bar input,
    .filter-bar select {
      border: 1px solid #cbd5e1;
      border-radius: 999px;
      padding: 10px 14px;
      font: inherit;
      background: white;
    }

    .filter-bar input {
      min-width: 280px;
      flex: 1;
    }

    .task-list {
      display: grid;
      gap: 16px;
    }

    .task-list-item {
      display: grid;
      gap: 8px;
    }

    .route-actions {
      display: flex;
      gap: 14px;
      justify-content: flex-end;
      padding-right: 8px;
    }

    .route-actions a {
      color: #2563eb;
      font-weight: 600;
      text-decoration: none;
    }

    .empty-state {
      padding: 18px;
      border-radius: 12px;
      background: #f8fafc;
    }

    .btn-primary,
    .btn-ghost {
      border-radius: 999px;
      padding: 10px 16px;
      font-weight: 600;
      text-decoration: none;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
    }

    .btn-ghost {
      background: #e2e8f0;
      color: #334155;
    }
  `]
})
export class TaskListPageComponent {
  readonly taskService = inject(TaskService);
  private readonly router = inject(Router);

  readonly today = new Date();

  readonly filterQuery = signal('');
  readonly statusFilter = signal<'all' | TaskStatus>('all');
  readonly priorityFilter = signal<'all' | TaskPriority>('all');

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
    this.filterQuery.set((event.target as HTMLInputElement).value);
  }

  onStatusFilterChange(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as 'all' | TaskStatus);
  }

  onPriorityFilterChange(event: Event): void {
    this.priorityFilter.set((event.target as HTMLSelectElement).value as 'all' | TaskPriority);
  }

  async openTask(taskId: string): Promise<void> {
    this.taskService.selectTask(taskId);
    await this.router.navigate(['/tasks', taskId]);
  }

  onStatusChanged(event: { taskId: string; status: TaskStatus }): void {
    this.taskService.updateStatus(event.taskId, event.status);
  }
}