import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

function redirectByRole(router: Router, authService: AuthService, roles: string[]): void {
  const target = authService.getHomeRoute(roles) ?? '/access-denied';
  router.navigate([target]);
}

export function canActivateAuthRole(requiredRole: string): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    console.log('[Guard] isLoggedIn:', authService.isLoggedIn());
    console.log('[Guard] roles:', authService.getRoles());

    if (!authService.isLoggedIn()) {
      authService.login();
      return false;
    }

    const roles = authService.getRoles();

    if (roles.includes(requiredRole)) {
      return true;
    }

    redirectByRole(router, authService, roles);
    return false;
  };
}

export const rootRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    authService.login();
    return false;
  }

  const roles = authService.getRoles();
  console.log('[RootGuard] roles:', roles);
  redirectByRole(router, authService, roles);
  return false;
};
