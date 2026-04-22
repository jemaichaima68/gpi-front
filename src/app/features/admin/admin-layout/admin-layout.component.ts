import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import {
  IonApp, IonSplitPane, IonMenu, IonHeader, IonToolbar, IonTitle,
  IonContent, IonList, IonItem, IonIcon, IonLabel, IonMenuToggle,
  IonButtons, IonMenuButton, IonFooter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, peopleOutline, listOutline, logOutOutline,
  sendOutline, personCircleOutline, settingsOutline,
  personOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ToastModule, BadgeModule, ButtonModule,
    IonApp, IonSplitPane, IonMenu, IonHeader, IonToolbar, IonTitle,
    IonContent, IonList, IonItem, IonIcon, IonLabel, IonMenuToggle,
    IonButtons, IonMenuButton, IonFooter
  ],
  providers: [MessageService],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit {

  username = '';
  avatarInitials = 'A';

  menuItems = [
    { label: 'Tableau de bord', icon: 'home-outline', route: '/admin/dashboard' },
    { label: 'Utilisateurs', icon: 'people-outline', route: '/admin/users' },
    { label: 'Logs d’activité', icon: 'list-outline', route: '/admin/logs' },
    { label: 'Règles métier', icon: 'settings-outline', route: '/admin/settings' },
  ];

  bottomItems = [
    { label: 'Mon Profil', icon: 'person-outline', route: '/admin/profile' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {
    addIcons({
      homeOutline, peopleOutline, listOutline, logOutOutline,
      sendOutline, personCircleOutline, settingsOutline,
      personOutline
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

  goToProfile(): void {
    this.router.navigate(['/admin/profile']);
  }

  onLogout(event: Event): void {
    event.stopPropagation();
    this.authService.logout();
  }
}