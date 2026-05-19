// auth.guard.ts - Version corrigée sans getHomeRoute
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

function redirectByRole(router: Router, authService: AuthService, roles: string[]): void {
  // ✅ Déterminer la route cible directement ici
  let target = '/access-denied';
  
  if (roles.includes('Admin')) {
    target = '/admin/dashboard';
  } else if (roles.includes('BACK_OFFICE')) {
    target = '/agent/dashboard';
  } else if (roles.includes('CLIENT')) {
    target = '/client/dashboard';  // ← Dashboard, pas tracking !
  }
  
  console.log('[Redirect] Roles:', roles, '→ Target:', target);
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