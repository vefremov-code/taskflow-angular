import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TaskService } from '../../../core/services/task.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="navbar">
      <a class="navbar__brand" href="#">
        TaskFlow
      </a>

      <div class="navbar__stats">
        <span class="navbar__badge">
          In Progress: {{ taskService.inProgressCount() }}
        </span>

        <span class="navbar__badge">
          Done: {{ taskService.doneCount() }}
        </span>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      background: #111827;
      color: #ffffff;
    }

    .navbar__brand {
      color: inherit;
      text-decoration: none;
      font-weight: 700;
      font-size: 1.2rem;
      letter-spacing: 0.02em;
    }

    .navbar__stats {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .navbar__badge {
      background: rgba(255, 255, 255, 0.12);
      padding: 0.35rem 0.7rem;
      border-radius: 999px;
      font-size: 0.85rem;
    }
  `]
})
export class NavbarComponent {
  readonly taskService = inject(TaskService);
}