import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationPopupComponent } from '../components/notification-popup/notification-popup.component';
import { TransferService } from '../services/transfer.service';
import { AuthService } from '../../../core/services/auth.service';
@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationPopupComponent],
  templateUrl: './client-layout.component.html',
  styleUrls: ['./client-layout.component.css']
})
export class ClientLayoutComponent implements OnInit {
  userInitials = 'HJ';
  unreadCount = 0;
  showNotifications = false;
  isMobileMenuOpen = false;

  constructor(
    private authService: AuthService,  // ← Injecter AuthService
    private transferService: TransferService,
        private router: Router // ← Ajouter Router

  ) {}

  ngOnInit() {
    this.loadUnreadCount();
    this.loadUserProfile();
  }

  loadUnreadCount() {
    this.transferService.getUnreadCount().subscribe({
      next: (count: number) => {
        this.unreadCount = count;
      },
      error: (err: any) => {
        console.error('Erreur chargement notifications:', err);
        this.unreadCount = 0;
      }
    });
  }

  loadUserProfile() {
    // Utiliser AuthService pour récupérer les infos utilisateur
    const fullName = this.authService.getFullName();
    const username = this.authService.getUsername();
    
    if (fullName && fullName !== ' ') {
      const names = fullName.split(' ');
      if (names.length >= 2) {
        this.userInitials = (names[0][0] + names[1][0]).toUpperCase();
      } else {
        this.userInitials = fullName.substring(0, 2).toUpperCase();
      }
    } else if (username) {
      this.userInitials = username.substring(0, 2).toUpperCase();
    }
    
    // Optionnel: appeler le backend pour plus d'infos
    this.transferService.getProfile().subscribe({
      next: (profile: any) => {
        if (profile?.fullName) {
          const names = profile.fullName.split(' ');
          if (names.length >= 2) {
            this.userInitials = (names[0][0] + names[1][0]).toUpperCase();
          }
        }
      },
      error: (err: any) => {
        console.error('Erreur chargement profil backend:', err);
      }
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.loadUnreadCount();
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  goToProfile() {
    this.router.navigate(['/client/profile']);
    this.isMobileMenuOpen = false;
  }

  // ========== DÉCONNEXION AVEC AUTH SERVICE ==========
  logout() {
    console.log('Déconnexion en cours...');
    this.authService.logout();  // ← Ça va marcher !
  }
}