import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';

interface SecurityLayer {
  title: string;
  status: string;
  description: string;
  items: string[];
}

interface SecurityDecision {
  concern: string;
  angularImplementation: string;
  serverRequirement: string;
}

@Component({
  selector: 'app-security-lab',
  standalone: true,
  imports: [JsonPipe, RouterLink, HasRoleDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="security-page">
      <header class="hero card">
        <div>
          <p class="eyebrow">Chapter 16</p>
          <h1>Authentication and Security</h1>
          <p>
            This lab evaluates TaskFlow's layered security architecture: authentication,
            authorization, route protection, token handling, XSS/CSRF defenses, and
            frontend/server responsibility boundaries.
          </p>
        </div>

        <div class="hero__actions">
          <a routerLink="/auth/login" class="pill">Login</a>
          <a routerLink="/tasks" class="pill">Protected Tasks</a>
          <a routerLink="/admin" class="pill">Admin Route</a>
        </div>
      </header>

      <section class="decision card">
        <div>
          <p class="eyebrow">Current Security Posture</p>
          <h2>{{ authService.isAuthenticatedSignal() ? 'Authenticated session active' : 'Unauthenticated session' }}</h2>
          <p>
            Access tokens remain in memory only. The demo simulates an httpOnly refresh
            cookie using session state so the chapter can demonstrate silent refresh,
            logout synchronization, and guard behavior without a custom backend.
          </p>
        </div>

        <div class="score-card">
          <span>Security Layer Score</span>
          <strong>{{ securityScore() }}/10</strong>
          <small>{{ securityLabel() }}</small>
        </div>
      </section>

      <section class="metric-grid" aria-label="Security metrics">
        <article class="metric-card">
          <span>Auth Checked</span>
          <strong>{{ snapshot().authChecked ? 'Yes' : 'No' }}</strong>
          <small>startup silent refresh completed</small>
        </article>

        <article class="metric-card">
          <span>Access Token</span>
          <strong>{{ snapshot().accessTokenPresent ? 'Memory' : 'None' }}</strong>
          <small>never persisted to localStorage</small>
        </article>

        <article class="metric-card">
          <span>User Role</span>
          <strong>{{ authService.primaryRole() }}</strong>
          <small>drives role guard and directive</small>
        </article>

        <article class="metric-card">
          <span>localStorage Token</span>
          <strong>{{ snapshot().localStorageTokenPresent ? 'Found' : 'Clear' }}</strong>
          <small>should remain clear</small>
        </article>
      </section>

      <section class="layer-grid">
        @for (layer of securityLayers; track layer.title) {
          <article class="layer-card card">
            <div class="layer-card__header">
              <p class="eyebrow">{{ layer.status }}</p>
              <h3>{{ layer.title }}</h3>
            </div>
            <p>{{ layer.description }}</p>
            <ul>
              @for (item of layer.items; track item) {
                <li>{{ item }}</li>
              }
            </ul>
          </article>
        }
      </section>

      <section class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Guard Testing</p>
            <h2>Route protection and role-based UI</h2>
          </div>
          <div class="button-row">
            <button type="button" class="btn-secondary" (click)="loginUser()">Login User</button>
            <button type="button" class="btn-secondary" (click)="loginAdmin()">Login Admin</button>
            <button type="button" class="btn-danger" (click)="logout()">Logout</button>
          </div>
        </div>

        <div class="guard-grid">
          <article>
            <h3>Visible to authenticated users</h3>
            @if (authService.isAuthenticatedSignal()) {
              <p class="success">Authenticated content is visible.</p>
            } @else {
              <p class="warning">Login is required before protected content appears.</p>
            }
          </article>

          <article>
            <h3>Admin-only directive</h3>
            <p *appHasRole="'admin'" class="success">
              Admin controls are rendered because the current user has the admin role.
            </p>
            @if (!authService.hasRole('admin')) {
              <p class="warning">Admin controls are not rendered for the current user.</p>
            }
          </article>
        </div>
      </section>

      <section class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Security Contract</p>
            <h2>Angular UX boundary vs server security boundary</h2>
          </div>
        </div>

        <div class="decision-table">
          <div class="decision-table__header">Security Concern</div>
          <div class="decision-table__header">Angular Implementation</div>
          <div class="decision-table__header">Server Requirement</div>

          @for (decision of securityDecisions; track decision.concern) {
            <div><strong>{{ decision.concern }}</strong></div>
            <div>{{ decision.angularImplementation }}</div>
            <div>{{ decision.serverRequirement }}</div>
          }
        </div>
      </section>

      <section class="card split">
        <article>
          <p class="eyebrow">Token State</p>
          <h2>Current authentication snapshot</h2>
          <p>
            This debug panel intentionally shows only a shortened token preview.
            The actual access token is kept in memory and is not written to browser storage.
          </p>
        </article>

        <pre>{{ snapshot() | json }}</pre>
      </section>

      <section class="card split">
        <article>
          <p class="eyebrow">Security Simulation</p>
          <h2>Refresh and logout behavior</h2>
          <p>
            These buttons simulate common authentication lifecycle events for the testing
            screenshots: clearing the in-memory token, refreshing it from the simulated
            httpOnly cookie, and verifying that logout clears the local session.
          </p>
        </article>

        <div class="button-stack">
          <button type="button" class="btn-secondary" (click)="clearAccessTokenOnly()">
            Clear Access Token Only
          </button>
          <button type="button" class="btn-secondary" (click)="refreshAccessToken()">
            Refresh Access Token
          </button>
          <button type="button" class="btn-secondary" (click)="simulateExpiredToken()">
            Simulate Expired Token
          </button>
        </div>
      </section>
    </section>
  `,
  styles: [`
    .security-page {
      width: min(1280px, calc(100% - 2rem));
      margin: 0 auto;
      padding: 2rem 0 4rem;
      display: grid;
      gap: 1.5rem;
      color: #0f172a;
    }

    .card {
      background: #ffffff;
      border: 1px solid #dbe4ef;
      border-radius: 1.25rem;
      padding: 1.5rem;
      box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
    }

    .hero,
    .decision,
    .section-heading,
    .split {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1.5rem;
    }

    .hero__actions,
    .button-row,
    .button-stack {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .button-stack {
      flex-direction: column;
      min-width: 230px;
    }

    .eyebrow {
      margin: 0 0 0.45rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 900;
      font-size: 0.78rem;
    }

    h1,
    h2,
    h3,
    p {
      margin-top: 0;
    }

    h1 {
      font-size: clamp(2rem, 4vw, 3.5rem);
      margin-bottom: 0.75rem;
    }

    h2 {
      font-size: clamp(1.35rem, 2vw, 2rem);
      margin-bottom: 0.75rem;
    }

    p,
    li,
    .decision-table div {
      line-height: 1.55;
    }

    .pill,
    .btn-secondary,
    .btn-danger {
      border: 0;
      border-radius: 999px;
      padding: 0.75rem 1rem;
      font: inherit;
      font-weight: 800;
      text-decoration: none;
      cursor: pointer;
    }

    .pill,
    .btn-secondary {
      color: #0f172a;
      background: #e8eef8;
    }

    .btn-danger {
      color: #fff;
      background: #b91c1c;
    }

    .score-card {
      min-width: 220px;
      border-radius: 1rem;
      padding: 1.25rem;
      background: #0f172a;
      color: #fff;
      text-align: center;
    }

    .score-card span,
    .score-card small {
      display: block;
      font-weight: 800;
    }

    .score-card strong {
      display: block;
      font-size: 3rem;
      line-height: 1;
      margin: 0.4rem 0;
    }

    .metric-grid,
    .layer-grid,
    .guard-grid {
      display: grid;
      gap: 1rem;
    }

    .metric-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .layer-grid,
    .guard-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .metric-card,
    .guard-grid article {
      background: #fff;
      border: 1px solid #dbe4ef;
      border-radius: 1rem;
      padding: 1.25rem;
    }

    .metric-card span,
    .metric-card small {
      color: #64748b;
      font-weight: 800;
    }

    .metric-card strong {
      display: block;
      font-size: 2rem;
      margin: 0.3rem 0;
    }

    .layer-card:nth-child(1) { border-left: 6px solid #16a34a; }
    .layer-card:nth-child(2) { border-left: 6px solid #2563eb; }
    .layer-card:nth-child(3) { border-left: 6px solid #f97316; }
    .layer-card:nth-child(4) { border-left: 6px solid #9333ea; }

    ul {
      padding-left: 1.25rem;
      margin-bottom: 0;
    }

    .success {
      padding: 0.85rem 1rem;
      background: #dcfce7;
      color: #166534;
      border-radius: 0.8rem;
      font-weight: 800;
    }

    .warning {
      padding: 0.85rem 1rem;
      background: #fef3c7;
      color: #92400e;
      border-radius: 0.8rem;
      font-weight: 800;
    }

    .decision-table {
      display: grid;
      grid-template-columns: 0.8fr 1.2fr 1.2fr;
      gap: 1px;
      background: #dbe4ef;
      border: 1px solid #dbe4ef;
      border-radius: 1rem;
      overflow: hidden;
    }

    .decision-table div {
      background: #f8fafc;
      padding: 1rem;
    }

    .decision-table__header {
      background: #0f172a !important;
      color: #fff;
      font-weight: 900;
    }

    pre {
      flex: 1;
      min-width: min(560px, 100%);
      margin: 0;
      padding: 1.25rem;
      overflow: auto;
      border-radius: 1rem;
      background: #0f172a;
      color: #e2e8f0;
      font-size: 0.95rem;
    }

    @media (max-width: 900px) {
      .hero,
      .decision,
      .section-heading,
      .split {
        display: grid;
      }

      .metric-grid,
      .layer-grid,
      .guard-grid {
        grid-template-columns: 1fr;
      }

      .decision-table {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SecurityLabComponent {
  readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  readonly snapshot = this.authService.securitySnapshot;

  readonly securityScore = computed(() => {
    const snapshot = this.snapshot();
    let score = 5;

    if (snapshot.authChecked) score += 1;
    if (snapshot.accessTokenPresent) score += 1;
    if (!snapshot.localStorageTokenPresent) score += 1;
    if (snapshot.sessionStorageProfilePresent) score += 1;
    if (snapshot.roles.length > 0) score += 1;

    return Math.min(score, 10);
  });

  readonly securityLabel = computed(() =>
    this.securityScore() >= 8 ? 'Layered security active' : 'Login required for full posture'
  );

  readonly securityLayers: SecurityLayer[] = [
    {
      title: 'Authentication',
      status: 'Identity layer',
      description: 'AuthService owns user identity, access-token memory state, session restoration, and logout coordination.',
      items: [
        'Access token is stored only in a signal.',
        'Non-sensitive profile data can survive refresh through sessionStorage.',
        'Refresh-token behavior is simulated as an httpOnly-cookie pattern.'
      ]
    },
    {
      title: 'Authorization',
      status: 'Access layer',
      description: 'Route guards and role directives enforce UI boundaries while the backend remains the real security authority.',
      items: [
        'authGuard protects routed features.',
        'roleGuard protects admin-only routes.',
        'HasRoleDirective removes restricted controls from the DOM.'
      ]
    },
    {
      title: 'HTTP Security',
      status: 'Transport layer',
      description: 'The auth interceptor injects Authorization headers and can refresh an expired token before retrying the original request.',
      items: [
        'Interceptor skips authentication endpoints.',
        '401 handling deduplicates concurrent refresh attempts.',
        'XSRF configuration is registered for cookie-based flows.'
      ]
    },
    {
      title: 'Data Protection',
      status: 'Browser layer',
      description: 'Angular template bindings, safe storage choices, and environment discipline reduce frontend exposure.',
      items: [
        'No access tokens in localStorage.',
        'Avoid bypassSecurityTrustHtml for user-generated content.',
        'Environment files contain only public configuration.'
      ]
    }
  ];

  readonly securityDecisions: SecurityDecision[] = [
    {
      concern: 'Token storage',
      angularImplementation: 'Access token lives in memory as a signal. User profile cache is non-sensitive sessionStorage data.',
      serverRequirement: 'Refresh token must be an httpOnly, Secure, SameSite cookie managed and invalidated by the backend.'
    },
    {
      concern: 'Route protection',
      angularImplementation: 'authInitializedGuard, authGuard, and roleGuard protect route navigation and improve UX.',
      serverRequirement: 'Every protected API endpoint must independently verify authentication and authorization.'
    },
    {
      concern: 'Role-based UI',
      angularImplementation: 'HasRoleDirective removes restricted controls from the DOM for non-authorized users.',
      serverRequirement: 'Server must reject restricted actions even if a user manually calls the endpoint.'
    },
    {
      concern: 'XSS prevention',
      angularImplementation: 'Angular sanitizes interpolation and property bindings. Avoid unsafe HTML bypasses.',
      serverRequirement: 'Server should sanitize stored rich text and return safe content contracts.'
    },
    {
      concern: 'Secrets',
      angularImplementation: 'Environment files contain URLs and public flags only.',
      serverRequirement: 'Secret keys, signing keys, database credentials, and privileged API keys stay server-side only.'
    }
  ];

  loginUser(): void {
    this.authService.loginAsUser();
    this.notificationService.success('Logged in as standard user.');
  }

  loginAdmin(): void {
    this.authService.loginAsAdmin();
    this.notificationService.success('Logged in as admin user.');
  }

  logout(): void {
    this.authService.logout();
    this.notificationService.info('Logged out and local session state cleared.');
  }

  clearAccessTokenOnly(): void {
    this.authService.clearAccessTokenOnly();
    this.notificationService.warning('Access token cleared. Refresh simulation remains available.');
  }

  refreshAccessToken(): void {
    this.authService.refreshAccessToken().subscribe({
      next: () => this.notificationService.success('Access token refreshed successfully.'),
      error: error => this.notificationService.error(error.message)
    });
  }

  simulateExpiredToken(): void {
    this.authService.simulateExpiredAccessToken();
    this.notificationService.warning('Expired token simulation applied.');
  }
}