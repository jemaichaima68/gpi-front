import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Rôles exacts Keycloak : Admin | BACK_OFFICE | CLIENT

function redirectByRole(router: Router, roles: string[]): void {
  // ✅ Changer l'ordre : d'abord Admin, puis BACK_OFFICE, puis CLIENT
  if (roles.includes('Admin')) {
    router.navigate(['/admin/dashboard']);
  } else if (roles.includes('BACK_OFFICE')) {
    router.navigate(['/agent/dashboard']);
  } else if (roles.includes('CLIENT')) {
    router.navigate(['/access-denied']);
  }
}

export function canActivateAuthRole(requiredRole: string): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router      = inject(Router);

    console.log('[Guard] isLoggedIn:', authService.isLoggedIn());
    console.log('[Guard] roles:', authService.getRoles());

    if (!authService.isLoggedIn()) {
      authService.login();
      return false;
    }

    const roles: string[] = authService.getRoles();

    if (roles.includes(requiredRole)) {
      return true;
    }

    redirectByRole(router, roles);
    return false;
  };
}

export const rootRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  if (!authService.isLoggedIn()) {
    authService.login();
    return false;
  }

  const roles: string[] = authService.getRoles();
  console.log('[RootGuard] roles:', roles);
  redirectByRole(router, roles);
  return false;
};