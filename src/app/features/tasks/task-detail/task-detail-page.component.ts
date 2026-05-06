import { DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { Task } from '../../../core/models/task.model';
import { TaskService } from '../../../core/services/task.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-task-detail-page',
  standalone: true,
  imports: [DatePipe, NgClass, RouterLink, TitleCasePipe, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="detail-page">
      <header class="detail-header">
        <div>
          <p class="eyebrow">Route-driven detail</p>
          <h1>{{ task().title }}</h1>
          <p class="muted">URL: /tasks/{{ task().id }}</p>
        </div>

        <div class="header-actions">
          <a class="btn-ghost" routerLink="/tasks">Back to Tasks</a>
          <a class="btn-primary" [routerLink]="['/tasks', task().id, 'edit']">Edit Task</a>
        </div>
      </header>

      <article class="detail-card">
        <header class="detail-card__header">
          <app-status-badge [status]="task().status" />
          <span [ngClass]="'priority priority--' + task().priority">
            {{ task().priority | titlecase }} Priority
          </span>
        </header>

        <p class="description">{{ task().description }}</p>

        <dl class="meta-grid">
          <div>
            <dt>Due Date</dt>
            <dd [class.overdue]="isOverdue()">
              @if (task().dueDate) {
                {{ task().dueDate | date:'MMM d, yyyy' }}
              } @else {
                No due date
              }
            </dd>
          </div>

          <div>
            <dt>Created</dt>
            <dd>{{ task().createdAt | date:'MMM d, yyyy' }}</dd>
          </div>

          <div>
            <dt>Updated</dt>
            <dd>{{ task().updatedAt | date:'MMM d, yyyy' }}</dd>
          </div>
        </dl>

        <section class="tags" aria-label="Task tags">
          @for (tag of task().tags; track tag) {
            <span class="tag">{{ tag }}</span>
          } @empty {
            <span class="muted">No tags</span>
          }
        </section>

        <footer class="detail-actions">
          @if (task().status !== 'done') {
            <button type="button" class="btn-primary" (click)="markDone()">
              Mark as Done
            </button>
          }

          <button type="button" class="btn-danger" (click)="deleteTask()">
            Delete Task
          </button>
        </footer>
      </article>
    </div>
  `,
  styles: [`
    .detail-page {
      max-width: 980px;
      margin: 0 auto;
      padding: 24px;
    }

    .detail-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 24px;
    }

    .detail-header h1 {
      margin: 0 0 8px;
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
      color: #64748b;
    }

    .header-actions,
    .detail-actions {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }

    .detail-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 24px;
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
    }

    .detail-card__header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
    }

    .description {
      color: #334155;
      line-height: 1.7;
      margin-bottom: 24px;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin: 0 0 24px;
    }

    dt {
      color: #64748b;
      font-size: 0.85rem;
      margin-bottom: 4px;
    }

    dd {
      margin: 0;
      font-weight: 700;
      color: #0f172a;
    }

    .overdue {
      color: #b91c1c;
    }

    .priority,
    .tag {
      display: inline-flex;
      width: fit-content;
      padding: 0.28rem 0.65rem;
      border-radius: 999px;
      font-size: 0.85rem;
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
    }

    .priority--critical,
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

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 24px;
    }

    .tag {
      background: #eef2ff;
      color: #3730a3;
    }

    .btn-primary,
    .btn-ghost,
    .btn-danger {
      border: 0;
      border-radius: 999px;
      padding: 10px 16px;
      cursor: pointer;
      font: inherit;
      font-weight: 700;
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

    .btn-danger {
      background: #dc2626;
      color: white;
    }
  `]
})
export class TaskDetailPageComponent {
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);

  readonly task = input.required<Task>();

  readonly isOverdue = computed(() => {
    const task = this.task();

    return (
      task.dueDate !== null &&
      task.dueDate < new Date() &&
      task.status !== 'done'
    );
  });

  markDone(): void {
    this.taskService.updateStatus(this.task().id, 'done');
  }

  async deleteTask(): Promise<void> {
    const id = this.task().id;
    this.taskService.deleteTask(id);
    await this.router.navigate(['/tasks']);
  }
}