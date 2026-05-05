import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import Keycloak from 'keycloak-js';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly roleHomeRoutes: Record<string, string> = {
    Admin: '/admin/dashboard',
    BACK_OFFICE: '/agent/dashboard',
    CLIENT: '/client/tracking'
  };

  private keycloak = inject(Keycloak);
  private router = inject(Router);

  isLoggedIn(): boolean {
    return !!this.keycloak.authenticated;
  }

  getUsername(): string {
    return (this.keycloak.tokenParsed as any)?.['preferred_username'] ?? '';
  }

  getEmail(): string {
    return (this.keycloak.tokenParsed as any)?.['email'] ?? '';
  }

  getFullName(): string {
    const payload = this.keycloak.tokenParsed as any;
    const firstName = payload?.['given_name'] ?? '';
    const lastName = payload?.['family_name'] ?? '';

    return `${firstName} ${lastName}`.trim() || this.getUsername();
  }

  getRoles(): string[] {
    const payload = this.keycloak.tokenParsed as any;
    return payload?.['realm_access']?.['roles'] ?? [];
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  getHomeRoute(roles: string[] = this.getRoles()): string | null {
    for (const role of ['Admin', 'BACK_OFFICE', 'CLIENT']) {
      if (roles.includes(role)) {
        return this.roleHomeRoutes[role];
      }
    }

    return null;
  }

  redirectByRole(roles: string[] = this.getRoles()): void {
    const target = this.getHomeRoute(roles) ?? '/access-denied';
    this.router.navigate([target]);
  }

  login(): Promise<void> {
    return this.keycloak.login();
  }

  logout(): void {
    this.keycloak.logout({
      redirectUri: window.location.origin
    });
  }
}
