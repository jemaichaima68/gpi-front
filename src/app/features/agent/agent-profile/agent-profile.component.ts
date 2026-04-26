import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-agent-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast position="top-right" />

    <div class="profile-container">
      <!-- En-tête -->
      <div class="profile-header">
        <div class="avatar">{{ initials }}</div>
        <h2>Mon Profil</h2>
        <p class="role">Agent Back-Office</p>
      </div>

      <!-- Informations personnelles -->
      <div class="profile-card">
        <h3><i class="pi pi-user"></i> Informations personnelles</h3>
        
        <div class="form-group">
          <label>Nom d'utilisateur</label>
          <input pInputText [value]="username" disabled />
        </div>

        <div class="form-group">
          <label>Email</label>
          <input pInputText [value]="email" disabled />
        </div>

        <div class="form-group">
          <label>Rôle</label>
          <input pInputText value="Agent Back-Office" disabled />
        </div>
      </div>

      <!-- Sécurité -->
      <div class="profile-card">
        <h3><i class="pi pi-shield"></i> Sécurité</h3>
        <p class="info-text">
          La gestion de votre mot de passe est effectuée par votre administrateur.
        </p>
      </div>

      <!-- Bouton retour -->
      <div class="actions">
        <p-button label="Retour au tableau de bord" icon="pi pi-arrow-left" 
                  (onClick)="goBack()" styleClass="p-button-outlined" />
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 24px;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .profile-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .avatar {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: bold;
      color: white;
      margin: 0 auto 16px;
    }

    h2 {
      margin: 0;
      color: #1e1b4b;
    }

    .role {
      color: #6366f1;
      font-weight: 600;
      margin-top: 8px;
    }

    .profile-card {
      background: white;
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
    }

    .profile-card h3 {
      margin: 0 0 20px;
      font-size: 1rem;
      font-weight: 700;
      color: #1e1b4b;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .profile-card h3 i {
      color: #6366f1;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      font-size: 0.7rem;
      font-weight: 700;
      color: #6b7280;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .form-group input {
      width: 100%;
      padding: 12px 14px;
      border-radius: 14px;
      border: 1.5px solid #e2e8f0;
      background: #f8fafc;
      font-size: 0.85rem;
    }

    .info-text {
      color: #64748b;
      font-size: 0.85rem;
      line-height: 1.5;
      margin: 0;
    }

    .actions {
      text-align: center;
      margin-top: 24px;
    }

    :host ::ng-deep .p-button {
      border-radius: 14px !important;
      font-weight: 600 !important;
      padding: 10px 24px !important;
    }
    :host {
  display: block;
  overflow: visible;
}
  `]
})
export class AgentProfileComponent implements OnInit {
  username = '';
  email = '';
  initials = 'A';

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.username = this.authService.getUsername();
    this.email = this.authService.getEmail();
    
    const parts = this.username.split(/[\s._-]/);
    if (parts.length >= 2) {
      this.initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
      this.initials = this.username.substring(0, 2).toUpperCase() || 'A';
    }
  }

  goBack() {
    this.router.navigate(['/agent/dashboard']);
  }
}