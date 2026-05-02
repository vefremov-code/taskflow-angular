import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    ToastContainerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-navbar />

    <main class="app-main">
      <router-outlet />
    </main>

    <app-toast-container />
  `,
  styles: [`
    .app-main {
      min-height: calc(100vh - 64px);
      background: #f9fafb;
    }
  `]
})
export class AppComponent {}