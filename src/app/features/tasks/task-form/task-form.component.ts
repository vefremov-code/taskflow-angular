import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormArray,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { of } from 'rxjs';

import {
  CreateTaskData,
  Task,
  TaskPriority,
  TaskStatus,
  UpdateTaskData
} from '../../../core/models/task.model';
import { TaskService } from '../../../core/services/task.service';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss'
})
export class TaskFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskService);
  private readonly destroyRef = inject(DestroyRef);

  readonly task = input<Task | null>(null);
  readonly saved = output<Task>();
  readonly cancelled = output<void>();

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly mode = computed(() => this.task() ? 'Edit' : 'Create');

  readonly priorityOptions: { value: TaskPriority; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  readonly statusOptions: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: 'To Do' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
    { value: 'blocked', label: 'Blocked' }
  ];

  readonly form = this.fb.group({
    title: this.fb.control('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ],
      asyncValidators: [this.duplicateTitleValidator()],
      updateOn: 'blur'
    }),
    description: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)]
    }),
    priority: this.fb.control<TaskPriority>('medium', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    status: this.fb.control<TaskStatus>('todo', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    dueDate: this.fb.control('', {
      nonNullable: true
    }),
    tags: this.fb.array<FormControl<string>>([])
  });

  constructor() {
    this.priorityCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(priority => {
        if (priority === 'critical') {
          this.dueDateCtrl.setValidators([Validators.required]);
        } else {
          this.dueDateCtrl.clearValidators();
        }

        this.dueDateCtrl.updateValueAndValidity();
      });

    effect(() => {
      this.patchFromTask(this.task());
    });
  }

  get titleCtrl(): FormControl<string> {
    return this.form.controls.title;
  }

  get descriptionCtrl(): FormControl<string> {
    return this.form.controls.description;
  }

  get priorityCtrl(): FormControl<TaskPriority> {
    return this.form.controls.priority;
  }

  get statusCtrl(): FormControl<TaskStatus> {
    return this.form.controls.status;
  }

  get dueDateCtrl(): FormControl<string> {
    return this.form.controls.dueDate;
  }

  get tagsArray(): FormArray<FormControl<string>> {
    return this.form.controls.tags;
  }

  addTag(value = ''): void {
    this.tagsArray.push(
      this.fb.control(value, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(30),
          Validators.pattern(/^[a-z0-9-]+$/)
        ]
      })
    );
  }

  removeTag(index: number): void {
    this.tagsArray.removeAt(index);
    this.form.markAsDirty();
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const raw = this.form.getRawValue();

    const taskData: CreateTaskData = {
      title: raw.title.trim(),
      description: raw.description.trim(),
      priority: raw.priority,
      status: raw.status,
      dueDate: raw.dueDate ? new Date(raw.dueDate) : null,
      tags: raw.tags
        .map(tag => tag.trim().toLowerCase())
        .filter(Boolean),
      assigneeId: 'user-1',
      projectId: 'proj-1'
    };

    try {
      const existingTask = this.task();
      let savedTask: Task | null;

      if (existingTask) {
        savedTask = this.taskService.updateTask(existingTask.id, taskData as UpdateTaskData);
      } else {
        savedTask = this.taskService.addTask(taskData);
      }

      if (!savedTask) {
        throw new Error('Unable to save task. Please try again.');
      }

      this.taskService.selectTask(savedTask.id);
      this.form.markAsPristine();
      this.saved.emit(savedTask);
    } catch (error) {
      this.submitError.set(
        error instanceof Error
          ? error.message
          : 'An error occurred. Please try again.'
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.isSubmitting();
  }

  getControlError(controlName: string): string {
    const control = this.form.get(controlName);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;

    if (errors['required']) {
      return 'This field is required.';
    }

    if (errors['minlength']) {
      return 'Too short.';
    }

    if (errors['maxlength']) {
      return 'Too long.';
    }

    if (errors['pattern']) {
      return 'Use lowercase letters, numbers, and hyphens only.';
    }

    if (errors['duplicate']) {
      return 'A task with this title already exists.';
    }

    return 'Invalid value.';
  }

  getTagError(index: number): string {
    const control = this.tagsArray.at(index);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;

    if (errors['required']) {
      return 'Tag is required.';
    }

    if (errors['maxlength']) {
      return 'Tag must be 30 characters or fewer.';
    }

    if (errors['pattern']) {
      return 'Use lowercase letters, numbers, and hyphens only.';
    }

    return 'Invalid tag.';
  }

  private patchFromTask(task: Task | null): void {
    this.tagsArray.clear();

    if (!task) {
      this.form.reset({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        dueDate: '',
        tags: []
      });
      this.form.markAsPristine();
      return;
    }

    this.form.patchValue({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : ''
    });

    task.tags.forEach(tag => this.addTag(tag));
    this.form.markAsPristine();
  }

  private duplicateTitleValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      const value = String(control.value ?? '').trim();

      if (!value || value.length < 3) {
        return of(null);
      }

      const exists = this.taskService.titleExists(value, this.task()?.id);

      return of(exists ? { duplicate: true } : null);
    };
  }
}