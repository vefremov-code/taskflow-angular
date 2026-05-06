import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="message-page">
      <h1>Page Not Found</h1>
      <p>The route you requested does not exist.</p>
      <a routerLink="/dashboard">Back to Dashboard</a>
    </div>
  `,
  styles: [`
    .message-page {
      max-width: 620px;
      margin: 0 auto;
      padding: 48px 24px;
      text-align: center;
    }

    p {
      color: #64748b;
    }

    a {
      color: #2563eb;
      font-weight: 700;
      text-decoration: none;
    }
  `]
})
export class NotFoundComponent {}