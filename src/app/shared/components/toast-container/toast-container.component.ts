import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="toast-container"
      aria-live="polite"
      aria-atomic="false"
      role="region"
      aria-label="Notifications"
    >
      @for (toast of notifications(); track toast.id) {
        <div
          class="toast"
          [ngClass]="'toast--' + toast.type"
          role="alert"
          [attr.aria-label]="toast.type + ': ' + toast.message"
        >
          <span class="toast__message">{{ toast.message }}</span>

          <button
            type="button"
            class="toast__dismiss"
            (click)="dismiss(toast.id)"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      right: 1.5rem;
      bottom: 1.5rem;
      display: grid;
      gap: 0.75rem;
      z-index: 1000;
      width: min(360px, calc(100vw - 3rem));
    }

    .toast {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.9rem 1rem;
      border-radius: 0.75rem;
      color: #fff;
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.18);
      font-size: 0.95rem;
      line-height: 1.4;
    }

    .toast--success {
      background: #15803d;
    }

    .toast--info {
      background: #2563eb;
    }

    .toast--warning {
      background: #b45309;
    }

    .toast--error {
      background: #b91c1c;
    }

    .toast__message {
      flex: 1;
    }

    .toast__dismiss {
      border: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
    }
  `]
})
export class ToastContainerComponent {
  private notificationService = inject(NotificationService);

  readonly notifications = this.notificationService.notifications;

  dismiss(id: string): void {
    this.notificationService.dismiss(id);
  }
}