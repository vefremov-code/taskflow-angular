import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { Task, TaskStatus } from '../../../core/models/task.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [DatePipe, NgClass, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="task-card" [ngClass]="'priority-' + task().priority">
      <div class="task-card__status">
        <app-status-badge [status]="task().status" />
      </div>

      <div class="task-card__content">
        <h3 class="task-card__title">{{ task().title }}</h3>
        <p class="task-card__description">{{ task().description }}</p>

        <div class="task-card__meta">
          @if (task().dueDate) {
            <span class="task-card__due-date">
              Due: {{ task().dueDate | date:'MMM d' }}
            </span>
          }

          <div class="task-card__tags">
            @for (tag of task().tags; track tag) {
              <span class="task-card__tag">{{ tag }}</span>
            }
          </div>
        </div>
      </div>

      <div class="task-card__actions">
        <button class="btn-secondary" type="button" (click)="handleSelect()">
          View
        </button>

        @if (task().status !== 'done') {
          <button class="btn-primary" type="button" (click)="handleDone()">
            Mark done
          </button>
        }
      </div>
    </article>
  `,
  styles: [`
  :host {
    display: block;
  }

  .task-card {
    display: grid;
    grid-template-columns: 140px 1fr auto;
    gap: 16px;
    align-items: start;
    padding: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: white;
  }

  .task-card__title {
    margin: 0 0 6px;
    font-size: 1.5rem;
  }

  .task-card__description {
    margin: 0 0 10px;
    color: #555;
  }

  .task-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }

  .task-card__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .task-card__tag {
    display: inline-block;
    border-radius: 999px;
    padding: 6px 10px;
    background: #f1f5f9;
    font-size: 0.9rem;
  }

  .task-card__actions {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .btn-primary,
  .btn-secondary {
    border: none;
    border-radius: 999px;
    padding: 8px 14px;
    cursor: pointer;
    font: inherit;
  }

  .btn-primary {
    background: #2563eb;
    color: white;
  }

  .btn-secondary {
    background: #eef2ff;
    color: #1e3a8a;
  }

  @media (max-width: 768px) {
    .task-card {
      grid-template-columns: 1fr;
    }

    .task-card__actions {
      justify-content: flex-start;
    }
  }
  `]
})
export class TaskCardComponent {
  task = input.required<Task>();

  taskSelected = output<string>();
  statusChanged = output<{ taskId: string; status: TaskStatus }>();

  handleSelect(): void {
    this.taskSelected.emit(this.task().id);
  }

  handleDone(): void {
    this.statusChanged.emit({
      taskId: this.task().id,
      status: 'done'
    });
  }
}