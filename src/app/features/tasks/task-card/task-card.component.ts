import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Task, TaskStatus } from '../../../core/models/task.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [NgClass, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="task-card"
      [class.task-card--selected]="isSelected()"
      (click)="selectTask()"
    >
      <header class="task-card__header">
        <div>
          <h3 class="task-card__title">{{ task().title }}</h3>
          <p class="task-card__description">{{ task().description }}</p>
        </div>

        <app-status-badge [status]="task().status" />
      </header>

      <div class="task-card__meta">
        <span [ngClass]="'priority priority--' + task().priority">
          {{ task().priority }}
        </span>

        @for (tag of task().tags; track tag) {
          <span class="tag">{{ tag }}</span>
        }
      </div>

      <footer class="task-card__actions" (click)="$event.stopPropagation()">
        <button
          type="button"
          (click)="changeStatus('todo')"
        >
          Todo
        </button>

        <button
          type="button"
          (click)="changeStatus('in-progress')"
        >
          In Progress
        </button>

        <button
          type="button"
          (click)="changeStatus('done')"
        >
          Done
        </button>

        <button
          type="button"
          (click)="changeStatus('blocked')"
        >
          Blocked
        </button>
      </footer>
    </article>
  `,
  styles: [`
    .task-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 0.9rem;
      padding: 1rem;
      cursor: pointer;
      transition:
        border-color 160ms ease,
        box-shadow 160ms ease,
        transform 160ms ease;
    }

    .task-card:hover {
      border-color: #93c5fd;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
      transform: translateY(-1px);
    }

    .task-card--selected {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
    }

    .task-card__header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }

    .task-card__title {
      margin: 0;
      font-size: 1.05rem;
    }

    .task-card__description {
      margin: 0.35rem 0 0;
      color: #6b7280;
      line-height: 1.5;
    }

    .task-card__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .priority,
    .tag {
      padding: 0.25rem 0.55rem;
      border-radius: 999px;
      font-size: 0.8rem;
      background: #f3f4f6;
      color: #374151;
    }

    .priority--high {
      background: #fee2e2;
      color: #991b1b;
    }

    .priority--medium {
      background: #fef3c7;
      color: #92400e;
    }

    .priority--low {
      background: #dcfce7;
      color: #166534;
    }

    .task-card__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .task-card__actions button {
      border: 0;
      border-radius: 0.5rem;
      background: #f3f4f6;
      padding: 0.45rem 0.7rem;
      cursor: pointer;
      font: inherit;
      font-size: 0.85rem;
    }

    .task-card__actions button:hover {
      background: #e5e7eb;
    }
  `]
})
export class TaskCardComponent {
  readonly task = input.required<Task>();
  readonly isSelected = input(false);
  readonly highlightTerm = input('');

  readonly taskSelected = output<string>();
  readonly statusChanged = output<{ taskId: string; status: TaskStatus }>();

  selectTask(): void {
    this.taskSelected.emit(this.task().id);
  }

  changeStatus(status: TaskStatus): void {
    this.statusChanged.emit({
      taskId: this.task().id,
      status
    });
  }
}