import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ToastContainerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet />

    <app-toast-container />
  `,
  styleUrl: './app.scss'
})
export class App {}