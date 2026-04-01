import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="denied-page">
      <div class="denied-card">
        <div class="denied-icon"><i class="pi pi-lock"></i></div>
        <h1>Accès refusé</h1>
        <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        <div class="denied-actions">
          <p-button label="Se déconnecter" icon="pi pi-sign-out"
                    severity="secondary" (onClick)="logout()"/>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .denied-page {
      min-height: 100dvh;
      background: linear-gradient(135deg, #1a237e, #4a148c);
      display: flex; align-items: center; justify-content: center;
    }
    .denied-card {
      background: white; border-radius: 16px; padding: 3rem;
      text-align: center; max-width: 400px; width: 90%;
    }
    .denied-icon {
      width: 80px; height: 80px; border-radius: 50%;
      background: #fff3e0; color: #e65100;
      font-size: 2rem; display: flex; align-items: center;
      justify-content: center; margin: 0 auto 1.5rem;
    }
    h1 { color: #1a237e; font-size: 1.8rem; margin: 0 0 0.5rem; }
    p  { color: #888; margin: 0 0 1.5rem; }
    .denied-actions { display: flex; justify-content: center; gap: 0.75rem; }
  `]
})
export class AccessDeniedComponent {
  constructor(private authService: AuthService) {}
  logout() { this.authService.logout(); }
}