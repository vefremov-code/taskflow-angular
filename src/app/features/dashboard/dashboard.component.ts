import { ChangeDetectionStrategy, Component, computed, signal, inject  } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Task, TaskStatus } from '../../core/models/task.model';
import { TaskCardComponent } from '../tasks/task-card/task-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [TaskCardComponent, DatePipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
    private router = inject(Router);
  tasks = signal<Task[]>([
    {
      id: '1',
      title: 'Design system audit',
      description: 'Review all UI components for accessibility compliance',
      status: 'in-progress',
      priority: 'high',
      assigneeId: 'user-1',
      projectId: 'proj-1',
      dueDate: new Date(2024, 11, 20),
      createdAt: new Date(2024, 10, 1),
      updatedAt: new Date(2024, 11, 10),
      tags: ['design', 'a11y']
    },
    {
      id: '2',
      title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated testing and deployment',
      status: 'todo',
      priority: 'critical',
      assigneeId: 'user-2',
      projectId: 'proj-1',
      dueDate: new Date(2024, 11, 15),
      createdAt: new Date(2024, 11, 1),
      updatedAt: new Date(2024, 11, 1),
      tags: ['devops', 'infrastructure']
    },
    {
      id: '3',
      title: 'Write unit tests for TaskService',
      description: 'Achieve 80% coverage on the core task service',
      status: 'done',
      priority: 'medium',
      assigneeId: 'user-1',
      projectId: 'proj-2',
      dueDate: null,
      createdAt: new Date(2024, 10, 20),
      updatedAt: new Date(2024, 11, 5),
      tags: ['testing']
    }
  ]);

  totalTasks = computed(() => this.tasks().length);
  completedTasks = computed(() =>
    this.tasks().filter(t => t.status === 'done').length
  );
  inProgressTasks = computed(() =>
    this.tasks().filter(t => t.status === 'in-progress').length
  );
  criticalTasks = computed(() =>
    this.tasks().filter(t => t.priority === 'critical').length
  );

  today = new Date();

  onTaskSelected(taskId: string): void {
    this.router.navigate(['/tasks', taskId]);
  }

  onStatusChanged(event: { taskId: string; status: TaskStatus }): void {
    this.tasks.update(tasks =>
      tasks.map(task =>
        task.id === event.taskId
          ? { ...task, status: event.status }
          : task
      )
    );
  }

}