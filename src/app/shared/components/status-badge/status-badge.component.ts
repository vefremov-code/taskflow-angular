import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { TaskStatus } from '../../../core/models/task.model';

const STATUS_CONFIG: Record<TaskStatus, { label: string; cssClass: string }> = {
  'todo':        { label: 'To Do',       cssClass: 'badge--todo' },
  'in-progress': { label: 'In Progress', cssClass: 'badge--progress' },
  'done':        { label: 'Done',        cssClass: 'badge--done' },
  'blocked':     { label: 'Blocked',     cssClass: 'badge--blocked' },
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="status-badge"
      [ngClass]="config().cssClass"
      role="status"
      [attr.aria-label]="'Task status: ' + config().label">
      {{ config().label }}
    </span>
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge--todo { background: #f1f5f9; }
    .badge--progress { background: #dbeafe; }
    .badge--done { background: #dcfce7; }
    .badge--blocked { background: #fee2e2; }
  `]
})
export class StatusBadgeComponent {
  status = input.required<TaskStatus>();
  config = computed(() => STATUS_CONFIG[this.status()]);
}