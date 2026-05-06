import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TransferService } from '../../services/transfer.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="profile-container">
      
      <!-- Header avec dégradé -->
      <div class="profile-header">
        <div class="profile-avatar">
          <div class="avatar-image">
            <span class="avatar-icon">{{ userInitials }}</span>
          </div>
          <div class="profile-title">
            <h1 class="profile-name">{{ fullName || 'Client' }}</h1>
            <span class="profile-role">{{ userRole || 'Client' }}</span>
          </div>
        </div>
      </div>

      <!-- Carte des informations personnelles -->
      <div class="profile-card">
        <h2 class="card-title">Informations personnelles</h2>
        
        <div class="info-table">
          <div class="info-row">
            <div class="info-label">Nom complet</div>
            <div class="info-value">{{ fullName || '-' }}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">Nom d'utilisateur</div>
            <div class="info-value">{{ username || '-' }}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">Email</div>
            <div class="info-value">{{ email || '-' }}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">Rôle</div>
            <div class="info-value">{{ userRole || 'Client' }}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">Membre depuis</div>
            <div class="info-value">{{ memberSince || 'Non disponible' }}</div>
          </div>
        </div>
      </div>

      <!-- Message d'information -->
      <div class="info-message">
        <div class="message-icon">i</div>
        <p class="message-text">La gestion de votre mot de passe est effectuée par votre administrateur Keycloak.</p>
      </div>

      <!-- Bouton retour -->
      <div class="profile-actions">
        <button routerLink="/client/dashboard" class="btn-back">
          ← Retour au tableau de bord
        </button>
      </div>

    </div>
  `,
  styles: `
    .profile-container {
      max-width: 700px;
      margin: 0 auto;
      padding: 20px;
    }

    .profile-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 24px;
      padding: 28px;
      margin-bottom: 24px;
      position: relative;
      overflow: hidden;
    }

    .profile-header::before {
      content: '';
      position: absolute;
      top: -30%;
      right: -10%;
      width: 200px;
      height: 200px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
    }

    .profile-avatar {
      display: flex;
      align-items: center;
      gap: 24px;
      position: relative;
      z-index: 1;
    }

    .avatar-image {
      width: 80px;
      height: 80px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255,255,255,0.3);
    }

    .avatar-icon {
      font-size: 36px;
      font-weight: 600;
      color: white;
    }

    .profile-title {
      color: white;
    }

    .profile-name {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: white;
    }

    .profile-role {
      display: inline-block;
      padding: 6px 16px;
      background: rgba(255,255,255,0.2);
      border-radius: 40px;
      font-size: 13px;
      font-weight: 500;
      color: white;
    }

    .profile-card {
      background: white;
      border-radius: 24px;
      padding: 24px;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    }

    .card-title {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #f1f5f9;
    }

    .info-row {
      display: flex;
      padding: 14px 0;
      border-bottom: 1px solid #f0f2f8;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      width: 160px;
      font-size: 14px;
      font-weight: 500;
      color: #64748b;
    }

    .info-value {
      flex: 1;
      font-size: 15px;
      font-weight: 500;
      color: #1a1f36;
    }

    .info-message {
      background: #f0f9ff;
      border-radius: 16px;
      padding: 16px 24px;
      margin-bottom: 28px;
      display: flex;
      align-items: center;
      gap: 14px;
      border-left: 4px solid #3b82f6;
    }

    .message-icon {
      font-size: 20px;
      font-weight: 700;
    }

    .message-text {
      margin: 0;
      font-size: 13px;
      color: #1e40af;
      line-height: 1.5;
    }

    .profile-actions {
      text-align: center;
    }

    .btn-back {
      padding: 12px 32px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 40px;
      font-size: 14px;
      font-weight: 600;
      color: #667eea;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-back:hover {
      background: #f8fafc;
      transform: translateY(-2px);
    }

    @media (max-width: 640px) {
      .profile-container {
        padding: 16px;
      }
      
      .profile-header {
        padding: 20px;
      }
      
      .profile-avatar {
        flex-direction: column;
        text-align: center;
      }
      
      .profile-name {
        font-size: 24px;
      }
      
      .info-row {
        flex-direction: column;
        gap: 6px;
      }
      
      .info-label {
        width: auto;
      }
      
      .info-message {
        flex-direction: column;
        text-align: center;
      }
    }
  `
})
export class ProfileComponent implements OnInit {
  fullName: string = '';
  username: string = '';
  email: string = '';
  userRole: string = 'Client';
  userInitials: string = '';
  memberSince: string = '';

  constructor(
    private authService: AuthService,
    private transferService: TransferService
  ) {}

  ngOnInit(): void {
    this.loadKeycloakProfile();
    this.loadBackendProfile(); 
  }

  loadKeycloakProfile() {
    // Récupérer les infos depuis Keycloak via AuthService
    this.fullName = this.authService.getFullName();
    this.username = this.authService.getUsername();
    this.email = this.authService.getEmail();
    
    // Récupérer les rôles
    const roles = this.authService.getRoles();
    if (roles.length > 0) {
      const role = roles[0];
      if (role === 'CLIENT') this.userRole = 'Client';
      else if (role === 'ADMIN' || role === 'Admin') this.userRole = 'Administrateur';
      else if (role === 'BACK_OFFICE') this.userRole = 'Agent Back Office';
      else this.userRole = role;
    }
    
    // Générer les initiales
    this.generateInitials();
  }

  generateInitials() {
    if (this.fullName && this.fullName.trim() !== '') {
      const names = this.fullName.trim().split(' ');
      if (names.length >= 2) {
        this.userInitials = (names[0][0] + names[1][0]).toUpperCase();
      } else {
        this.userInitials = this.fullName.substring(0, 2).toUpperCase();
      }
    } else if (this.username) {
      this.userInitials = this.username.substring(0, 2).toUpperCase();
    } else {
      this.userInitials = 'U';
    }
  }

  loadBackendProfile() {
    // Récupérer des infos complémentaires depuis le backend (comme la date d'inscription)
    this.transferService.getProfile().subscribe({
      next: (data: any) => {
        if (data) {
          if (data.memberSince) {
            this.memberSince = data.memberSince;
          }
          if (data.fullName && !this.fullName) {
            this.fullName = data.fullName;
            this.generateInitials();
          }
          if (data.email && !this.email) {
            this.email = data.email;
          }
        }
      },
      error: (err) => {
        console.error('Erreur chargement profil backend:', err);
        // Date par défaut si pas disponible
        const currentDate = new Date();
        this.memberSince = currentDate.toLocaleDateString('fr-FR', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        });
      }
    });
  }
}