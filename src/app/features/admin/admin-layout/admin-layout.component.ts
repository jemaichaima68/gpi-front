import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import {
  IonApp, IonSplitPane, IonMenu, IonHeader, IonToolbar, IonTitle,
  IonContent, IonList, IonItem, IonIcon, IonLabel, IonMenuToggle,
  IonButtons, IonMenuButton, IonFooter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, peopleOutline, listOutline, logOutOutline,
  sendOutline, notificationsOutline, personCircleOutline,
  settingsOutline
} from 'ionicons/icons';

export interface AppNotification {
  id:      number;
  type:    'add' | 'edit' | 'delete' | 'toggle' | 'system';
  message: string;
  time:    string;
  read:    boolean;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ToastModule,
    IonApp, IonSplitPane, IonMenu, IonHeader, IonToolbar, IonTitle,
    IonContent, IonList, IonItem, IonIcon, IonLabel, IonMenuToggle,
    IonButtons, IonMenuButton, IonFooter
  ],
  providers: [MessageService],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit {

  username        = '';
  avatarInitials  = 'A';
  showNotifications = false;

  notifications: AppNotification[] = [
    {
      id: 1,
      type: 'system',
      message: 'Plateforme GPI Tracker démarrée avec succès.',
      time: 'il y a 2 min',
      read: false
    }
  ];

  menuItems = [
    { label: 'Dashboard',        icon: 'home-outline',     route: '/admin/dashboard' },
    { label: 'Utilisateurs',     icon: 'people-outline',   route: '/admin/users'     },
    { label: 'Logs d\'activité', icon: 'list-outline',     route: '/admin/logs'      },
    { label: 'Paramètres',       icon: 'settings-outline', route: '/admin/settings'  },
  ];

  constructor(
    private authService:    AuthService,
    private router:         Router,
    private messageService: MessageService
  ) {
    addIcons({
      homeOutline, peopleOutline, listOutline, logOutOutline,
      sendOutline, notificationsOutline, personCircleOutline,
      settingsOutline
    });
  }

  ngOnInit() {
    this.username = this.authService.getUsername();
    const parts = this.username.split(/[\s._-]/);
    if (parts.length >= 2) {
      this.avatarInitials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
      this.avatarInitials = this.username.substring(0, 2).toUpperCase() || 'A';
    }
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  markAllRead() {
    this.notifications.forEach(n => n.read = true);
  }

  addNotification(type: AppNotification['type'], message: string) {
    this.notifications.unshift({
      id:      Date.now(),
      type,
      message,
      time:    'à l\'instant',
      read:    false
    });
  }

  getNotifIcon(type: string): string {
    switch (type) {
      case 'add':    return 'pi pi-user-plus';
      case 'edit':   return 'pi pi-pencil';
      case 'delete': return 'pi pi-trash';
      case 'toggle': return 'pi pi-sync';
      case 'system': return 'pi pi-server';
      default:       return 'pi pi-bell';
    }
  }

  goToProfile(): void {
    this.showNotifications = false;
    this.router.navigate(['/admin/settings']);
  }

  onLogout(event: Event): void {
    event.stopPropagation();
    this.authService.logout();
  }

  logout() {
    this.authService.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.showNotifications &&
        !target.closest('.notif-panel') &&
        !target.closest('.navbar-notification-btn')) {
      this.showNotifications = false;
    }
  }
}