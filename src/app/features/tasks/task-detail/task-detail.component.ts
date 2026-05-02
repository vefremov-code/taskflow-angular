import { DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TaskService } from '../../../core/services/task.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [DatePipe, NgClass, TitleCasePipe, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (task()) {
      <aside
        class="task-detail"
        role="complementary"
        [attr.aria-label]="'Details for task: ' + task()!.title"
      >
        <header class="task-detail__header">
          <app-status-badge [status]="task()!.status" />

          <button
            type="button"
            class="btn-icon"
            (click)="close()"
            aria-label="Close task details"
          >
            ✕
          </button>
        </header>

        <div class="task-detail__body">
          <h2 class="task-detail__title">{{ task()!.title }}</h2>

          <p class="task-detail__description">
            {{ task()!.description }}
          </p>

          <div class="task-detail__meta">
            <span class="meta-item">
              Priority:
              <strong [ngClass]="'text-' + task()!.priority">
                {{ task()!.priority | titlecase }}
              </strong>
            </span>

            @if (task()!.dueDate) {
              <span
                class="meta-item"
                [class.overdue]="isOverdue()"
              >
                Due: {{ task()!.dueDate | date:'MMM d, yyyy' }}
              </span>
            }
          </div>

          <div class="task-detail__tags">
            @for (tag of task()!.tags; track tag) {
              <span class="tag">{{ tag }}</span>
            }
          </div>
        </div>

        <footer class="task-detail__actions">
          @if (task()!.status !== 'done') {
            <button
              type="button"
              class="btn-primary"
              (click)="markDone()"
            >
              Mark as Done
            </button>
          }

          <button
            type="button"
            class="btn-danger"
            (click)="deleteTask()"
          >
            Delete
          </button>
        </footer>
      </aside>
    }
  `,
  styles: [`
    .task-detail {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 1rem;
      padding: 1.25rem;
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
      min-width: 320px;
    }

    .task-detail__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .task-detail__title {
      margin: 0 0 0.75rem;
      font-size: 1.35rem;
      line-height: 1.2;
    }

    .task-detail__description {
      color: #4b5563;
      line-height: 1.6;
    }

    .task-detail__meta {
      display: grid;
      gap: 0.5rem;
      margin: 1rem 0;
      color: #374151;
      font-size: 0.95rem;
    }

    .text-low {
      color: #047857;
    }

    .text-medium {
      color: #b45309;
    }

    .text-high {
      color: #b91c1c;
    }

    .overdue {
      color: #b91c1c;
      font-weight: 600;
    }

    .task-detail__tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .tag {
      padding: 0.25rem 0.55rem;
      border-radius: 999px;
      background: #eef2ff;
      color: #3730a3;
      font-size: 0.8rem;
    }

    .task-detail__actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.25rem;
    }

    .btn-icon,
    .btn-primary,
    .btn-danger {
      cursor: pointer;
      border: 0;
      border-radius: 0.6rem;
      font: inherit;
    }

    .btn-icon {
      background: #f3f4f6;
      padding: 0.4rem 0.6rem;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
      padding: 0.65rem 1rem;
    }

    .btn-danger {
      background: #dc2626;
      color: white;
      padding: 0.65rem 1rem;
    }
  `]
})
export class TaskDetailComponent {
  private taskService = inject(TaskService);

  readonly task = this.taskService.selectedTask;

  readonly isOverdue = computed(() => {
    const task = this.task();

    return (
      task !== null &&
      task.dueDate !== null &&
      task.dueDate < new Date() &&
      task.status !== 'done'
    );
  });

  close(): void {
    this.taskService.clearSelection();
  }

  markDone(): void {
    const task = this.task();

    if (!task) {
      return;
    }

    this.taskService.updateStatus(task.id, 'done');
  }

  deleteTask(): void {
    const task = this.task();

    if (!task) {
      return;
    }

    this.taskService.deleteTask(task.id);
  }
}