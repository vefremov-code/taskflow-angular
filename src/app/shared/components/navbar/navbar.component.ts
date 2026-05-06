import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { TaskService } from '../../../core/services/task.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="navbar" role="navigation" aria-label="Main navigation">
      <a class="navbar__brand" routerLink="/dashboard">
        TaskFlow
      </a>

      <div class="navbar__links">
        <a
          routerLink="/dashboard"
          routerLinkActive="navbar__link--active"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          Dashboard
        </a>

        <a
          routerLink="/tasks"
          routerLinkActive="navbar__link--active"
        >
          Tasks
        </a>

        <a
          routerLink="/signals"
          routerLinkActive="navbar__link--active"
        >
          Signals
        </a>

        <a
          routerLink="/admin"
          routerLinkActive="navbar__link--active"
        >
          Admin
        </a>
      </div>

      <div class="navbar__stats">
        <span class="navbar__badge">
          In Progress: {{ taskService.inProgressCount() }}
        </span>

        <span class="navbar__badge">
          Done: {{ taskService.doneCount() }}
        </span>

        <span class="navbar__badge">
          Complete: {{ taskService.completionRate() }}%
        </span>

        <button
          type="button"
          class="navbar__auth"
          (click)="loginAsAdmin()"
          title="Demo helper: grants admin role for Chapter 8 guard testing"
        >
          Admin Demo
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      min-height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 1.5rem;
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

    .navbar__links,
    .navbar__stats {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .navbar__links a {
      color: #d1d5db;
      text-decoration: none;
      font-weight: 600;
      padding: 0.35rem 0.7rem;
      border-radius: 999px;
    }

    .navbar__links a:hover,
    .navbar__links .navbar__link--active {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.12);
    }

    .navbar__badge,
    .navbar__auth {
      background: rgba(255, 255, 255, 0.12);
      color: white;
      padding: 0.35rem 0.7rem;
      border-radius: 999px;
      font-size: 0.85rem;
    }

    .navbar__auth {
      border: 0;
      cursor: pointer;
      font: inherit;
    }
  `]
})
export class NavbarComponent {
  readonly taskService = inject(TaskService);
  private readonly authService = inject(AuthService);

  loginAsAdmin(): void {
    this.authService.loginAsAdmin();
  }
}