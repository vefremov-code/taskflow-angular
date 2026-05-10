import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  computed,
  effect,
  inject
} from '@angular/core';

import { AuthService } from '../../core/services/auth.service';

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective {
  private readonly authService = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  private requiredRole = '';
  private hasView = false;

  private readonly canRender = computed(() =>
    this.requiredRole.length === 0 || this.authService.hasRole(this.requiredRole)
  );

  constructor() {
    effect(() => {
      const canRender = this.canRender();

      if (canRender && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      }

      if (!canRender && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }

  @Input('appHasRole')
  set role(role: string) {
    this.requiredRole = role;
  }
}