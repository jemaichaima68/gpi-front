import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import Keycloak from 'keycloak-js';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private keycloak = inject(Keycloak);
  private router   = inject(Router);

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
    const p = this.keycloak.tokenParsed as any;
    const first = p?.['given_name']  ?? '';
    const last  = p?.['family_name'] ?? '';
    return `${first} ${last}`.trim() || this.getUsername();
  }

  getRoles(): string[] {
    const p = this.keycloak.tokenParsed as any;
    return p?.['realm_access']?.['roles'] ?? [];
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  redirectByRole(): void {
    const roles = this.getRoles();
    
    // ✅ Changer l'ordre : d'abord Admin, puis BACK_OFFICE, puis CLIENT
    if (roles.includes('Admin'))       { this.router.navigate(['/admin/dashboard']);  return; }
    if (roles.includes('BACK_OFFICE')) { this.router.navigate(['/agent/dashboard']);  return; }
    if (roles.includes('CLIENT'))      { this.router.navigate(['/client/dashboard']); return; }
    
    this.router.navigate(['/access-denied']);
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