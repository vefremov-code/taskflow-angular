import { ChangeDetectionStrategy, Component, ViewChild, computed, input, inject } from '@angular/core';
import { Router } from '@angular/router';

import { HasUnsavedChanges } from '../../../core/guards/unsaved-changes.guard';
import { Task } from '../../../core/models/task.model';
import { TaskFormComponent } from './task-form.component';

@Component({
  selector: 'app-task-form-page',
  standalone: true,
  imports: [TaskFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-task-form
      [task]="task()"
      (saved)="onSaved($event)"
      (cancelled)="onCancelled()"
    />
  `
})
export class TaskFormPageComponent implements HasUnsavedChanges {
  private readonly router = inject(Router);

  readonly task = input<Task | null>(null);
  readonly isEditMode = computed(() => this.task() !== null);

  @ViewChild(TaskFormComponent)
  private readonly taskFormComponent?: TaskFormComponent;

  hasUnsavedChanges(): boolean {
    return this.taskFormComponent?.hasUnsavedChanges() ?? false;
  }

  async onSaved(task: Task): Promise<void> {
    await this.router.navigate(['/tasks', task.id]);
  }

  async onCancelled(): Promise<void> {
    await this.router.navigate(['/tasks']);
  }
}