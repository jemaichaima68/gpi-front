import { Component, OnInit, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
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
export class ClientLayoutComponent implements OnInit, AfterViewInit {  // ← Ajouter AfterViewInit
  @ViewChild('notificationPopupRef') notificationPopup!: NotificationPopupComponent;
  
  userInitials = 'HJ';
  unreadCount = 0;
  showNotifications = false;
  isMobileMenuOpen = false;
  currentPageTitle = 'Acceuil';

  constructor(
    private authService: AuthService,
    private transferService: TransferService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('🟢 ClientLayoutComponent.ngOnInit');
    
    this.loadUnreadCount();
    this.loadUserProfile();
    this.updatePageTitle(this.router.url);
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updatePageTitle(event.url);
      this.cdr.detectChanges();
    });
    
    this.cdr.detectChanges();
  }

  // ✅ Ajouter cette méthode
  ngAfterViewInit() {
    console.log('🟢 ClientLayoutComponent.ngAfterViewInit');
  }
  closeNotifications() {
  if (this.showNotifications) {
    this.showNotifications = false;
    this.cdr.detectChanges();
  }
}

  updatePageTitle(url: string) {
    if (url.includes('/client/dashboard')) {
      this.currentPageTitle = 'Acceuil';
    } else if (url.includes('/client/tracking')) {
      this.currentPageTitle = 'Suivi';
    } else if (url.includes('/client/history')) {
      this.currentPageTitle = 'Historique';
    } else if (url.includes('/client/profile')) {
      this.currentPageTitle = 'Mon Profil';
    } else {
      this.currentPageTitle = 'Espace Client';
    }
  }

  loadUnreadCount() {
    this.transferService.getUnreadCount().subscribe({
      next: (count: number) => {
        this.unreadCount = count;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erreur chargement notifications:', err);
        this.unreadCount = 0;
        this.cdr.detectChanges();
      }
    });
  }

  loadUserProfile() {
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
    
    this.cdr.detectChanges();
    
    this.transferService.getProfile().subscribe({
      next: (profile: any) => {
        if (profile?.fullName) {
          const names = profile.fullName.split(' ');
          if (names.length >= 2) {
            this.userInitials = (names[0][0] + names[1][0]).toUpperCase();
            this.cdr.detectChanges();
          }
        }
      },
      error: (err: any) => {
        console.error('Erreur chargement profil backend:', err);
      }
    });
  }

  // ✅ Version corrigée de toggleNotifications
 toggleNotifications() {
  this.showNotifications = !this.showNotifications;
  
  if (this.showNotifications) {
    // Recharger le compteur dans le parent
    this.loadUnreadCount();
  }
  
  this.cdr.detectChanges();
}

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.cdr.detectChanges();
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    this.cdr.detectChanges();
  }

  goToProfile() {
    this.router.navigate(['/client/profile']);
    this.closeMobileMenu();
  }

  logout() {
    console.log('Déconnexion en cours...');
    this.authService.logout();
  }
}