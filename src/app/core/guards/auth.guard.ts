import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot
} from '@angular/router';
import { filter, map, take } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

import { AuthService } from '../services/auth.service';

export const authInitializedGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  if (auth.authChecked()) {
    return true;
  }

  return toObservable(auth.authChecked).pipe(
    filter(Boolean),
    take(1),
    map(() => true)
  );
};

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
};

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const requiredRole = route.data['requiredRole'] as string | undefined;

  if (!requiredRole || auth.hasRole(requiredRole)) {
    return true;
  }

  return router.createUrlTree(['/access-denied']);
};