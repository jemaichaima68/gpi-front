import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

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

    if (authService.hasRole(requiredRole)) {
      return true;
    }

    router.navigate(['/access-denied']);
    return false;
  };
}