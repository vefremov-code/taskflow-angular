import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { TaskService } from '../../core/services/task.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="admin-page">
      <p class="eyebrow">Protected Route</p>
      <h1>Admin Dashboard</h1>
      <p class="muted">
        This page is protected by authGuard and roleGuard. Use the Admin Demo button in the navbar to grant admin access.
      </p>

      <section class="admin-grid">
        <div class="card">
          <strong>{{ taskService.totalCount() }}</strong>
          <span>Total Tasks</span>
        </div>
        <div class="card">
          <strong>{{ taskService.blockedCount() }}</strong>
          <span>Blocked Tasks</span>
        </div>
        <div class="card">
          <strong>{{ authService.currentUser()?.name }}</strong>
          <span>Current User</span>
        </div>
      </section>

      <a class="btn-primary" routerLink="/dashboard">Back to Dashboard</a>
    </div>
  `,
  styles: [`
    .admin-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 32px;
    }

    .eyebrow {
      margin: 0 0 4px;
      color: #2563eb;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.75rem;
    }

    h1 {
      margin: 0 0 8px;
    }

    .muted {
      color: #64748b;
      margin-bottom: 24px;
    }

    .admin-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .card {
      display: grid;
      gap: 6px;
      background: #f8fafc;
      border-radius: 16px;
      padding: 18px;
    }

    .card strong {
      font-size: 1.6rem;
    }

    .card span {
      color: #64748b;
    }

    .btn-primary {
      display: inline-block;
      border-radius: 999px;
      padding: 10px 16px;
      background: #2563eb;
      color: white;
      font-weight: 700;
      text-decoration: none;
    }
  `]
})
export class AdminDashboardComponent {
  readonly taskService = inject(TaskService);
  readonly authService = inject(AuthService);
}