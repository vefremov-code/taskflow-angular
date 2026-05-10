import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="login-shell">
      <div class="login-card">
        <p class="eyebrow">Chapter 16</p>
        <h1>Sign in to TaskFlow</h1>
        <p class="intro">
          This demo login keeps the access token in memory, persists only a
          non-sensitive user profile in sessionStorage, and simulates an
          httpOnly refresh cookie for silent refresh testing.
        </p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <label>
            Email
            <input
              type="email"
              formControlName="email"
              autocomplete="email"
              [attr.aria-invalid]="emailInvalid()"
            />
          </label>

          @if (emailInvalid()) {
            <p class="field-error" role="alert">Enter a valid demo email address.</p>
          }

          <label>
            Password
            <input
              type="password"
              formControlName="password"
              autocomplete="current-password"
              [attr.aria-invalid]="passwordInvalid()"
            />
          </label>

          @if (passwordInvalid()) {
            <p class="field-error" role="alert">Password must contain at least four characters.</p>
          }

          @if (loginError()) {
            <div class="error-banner" role="alert" aria-live="assertive">
              {{ loginError() }}
            </div>
          }

          <button type="submit" class="btn-primary" [disabled]="form.invalid || isLoading()">
            @if (isLoading()) { Signing in... } @else { Sign in }
          </button>
        </form>

        <div class="demo-actions" aria-label="Demo accounts">
          <button type="button" class="btn-ghost" (click)="useDemoUser()">
            Use User Demo
          </button>

          <button type="button" class="btn-ghost" (click)="useDemoAdmin()">
            Use Admin Demo
          </button>

          <a routerLink="/dashboard">Back to Dashboard</a>
        </div>

        <div class="demo-box">
          <strong>Demo accounts</strong>
          <span>user@taskflow.local / demo</span>
          <span>admin@taskflow.local / demo</span>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .login-shell {
      min-height: calc(100vh - 64px);
      display: grid;
      place-items: center;
      padding: 3rem 1rem;
      background: #f8fafc;
    }

    .login-card {
      width: min(720px, 100%);
      background: #fff;
      border: 1px solid #dbe4ef;
      border-radius: 1.25rem;
      padding: 2rem;
      box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
    }

    .eyebrow {
      margin: 0 0 0.5rem;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-size: 0.78rem;
      font-weight: 800;
    }

    h1 {
      margin: 0;
      font-size: clamp(2rem, 4vw, 3rem);
      color: #0f172a;
    }

    .intro {
      margin: 0.75rem 0 1.5rem;
      color: #475569;
      line-height: 1.6;
    }

    form,
    label {
      display: grid;
      gap: 0.5rem;
    }

    form {
      gap: 1rem;
    }

    label {
      font-weight: 800;
      color: #0f172a;
    }

    input {
      border: 1px solid #cbd5e1;
      border-radius: 0.85rem;
      padding: 0.85rem 1rem;
      font: inherit;
    }

    input[aria-invalid='true'] {
      border-color: #dc2626;
      outline-color: #dc2626;
    }

    .field-error {
      margin: -0.25rem 0 0;
      color: #b91c1c;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .error-banner {
      padding: 0.85rem 1rem;
      border-radius: 0.85rem;
      background: #fee2e2;
      color: #991b1b;
      font-weight: 800;
    }

    .btn-primary,
    .btn-ghost {
      border: 0;
      border-radius: 999px;
      padding: 0.8rem 1.15rem;
      cursor: pointer;
      font: inherit;
      font-weight: 800;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-ghost {
      background: #e8eef8;
      color: #0f172a;
    }

    .demo-actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    a {
      color: #2563eb;
      font-weight: 800;
      text-decoration: none;
    }

    .demo-box {
      margin-top: 1.5rem;
      display: grid;
      gap: 0.25rem;
      padding: 1rem;
      border-radius: 0.9rem;
      background: #f1f5f9;
      color: #334155;
    }
  `]
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly loginError = signal<string | null>(null);

  readonly form = this.fb.group({
    email: ['user@taskflow.local', [Validators.required, Validators.email]],
    password: ['demo', [Validators.required, Validators.minLength(4)]]
  });

  emailInvalid(): boolean {
    const control = this.form.controls.email;
    return control.invalid && control.touched;
  }

  passwordInvalid(): boolean {
    const control = this.form.controls.password;
    return control.invalid && control.touched;
  }

  useDemoUser(): void {
    this.form.setValue({ email: 'user@taskflow.local', password: 'demo' });
  }

  useDemoAdmin(): void {
    this.form.setValue({ email: 'admin@taskflow.local', password: 'demo' });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.loginError.set(null);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.isLoading.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (error: Error) => {
        this.isLoading.set(false);
        this.loginError.set(error.message);
        this.form.controls.password.reset('');
      }
    });
  }
}