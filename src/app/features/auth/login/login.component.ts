import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-page">
      <h1>Login</h1>
      <p class="muted">
        This demo login exists so Chapter 8 guards can redirect unauthenticated users.
      </p>

      <div class="actions">
        <button type="button" class="btn-primary" (click)="loginUser()">
          Login as User
        </button>

        <button type="button" class="btn-ghost" (click)="loginAdmin()">
          Login as Admin
        </button>

        <a routerLink="/dashboard">Back to Dashboard</a>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      max-width: 520px;
      margin: 0 auto;
      padding: 48px 24px;
    }

    h1 {
      margin: 0 0 8px;
    }

    .muted {
      color: #64748b;
      margin-bottom: 24px;
    }

    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
    }

    .btn-primary,
    .btn-ghost {
      border: 0;
      border-radius: 999px;
      padding: 10px 16px;
      cursor: pointer;
      font: inherit;
      font-weight: 700;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
    }

    .btn-ghost {
      background: #e2e8f0;
      color: #334155;
    }

    a {
      color: #2563eb;
      font-weight: 700;
      text-decoration: none;
    }
  `]
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  async loginUser(): Promise<void> {
    this.authService.loginAsUser();
    await this.navigateAfterLogin();
  }

  async loginAdmin(): Promise<void> {
    this.authService.loginAsAdmin();
    await this.navigateAfterLogin();
  }

  private async navigateAfterLogin(): Promise<void> {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
    await this.router.navigateByUrl(returnUrl);
  }
}