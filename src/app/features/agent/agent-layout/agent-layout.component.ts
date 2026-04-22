import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import {
  IonApp, IonSplitPane, IonMenu, IonHeader, IonToolbar, IonTitle,
  IonContent, IonList, IonItem, IonIcon, IonLabel,
  IonButtons, IonMenuButton, IonFooter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, logOutOutline, sendOutline, personCircleOutline,
  listOutline, personOutline, documentTextOutline,
  chevronDownOutline, chevronForwardOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-agent-layout',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ToastModule,
    IonApp, IonSplitPane, IonMenu, IonHeader, IonToolbar, IonTitle,
    IonContent, IonList, IonItem, IonIcon, IonLabel,
    IonButtons, IonMenuButton, IonFooter
  ],
  providers: [MessageService],
  templateUrl: './agent-layout.component.html',
  styleUrls: ['./agent-layout.component.css']
})
export class AgentLayoutComponent implements OnInit {

  username = '';
  avatarInitials = 'A';

  // Menu avec sous-menus
  menuItems = [
    { label: 'Dashboard', icon: 'home-outline', route: '/agent/dashboard', isParent: false },
    { 
      label: 'Transactions', 
      icon: 'list-outline', 
      isParent: true,
      expanded: false,
      children: [
        { label: 'Messages reçus', icon: 'document-text-outline', route: '/agent/transactions/recus' },
        { label: 'Messages émis', icon: 'send-outline', route: '/agent/transactions/emis' },
        { label: 'Transactions traitées', icon: 'checkmark-circle-outline', route: '/agent/transactions/traitees' }
      ]
    },
    { label: 'Logs activité', icon: 'document-text-outline', route: '/agent/logs', isParent: false },
    { label: 'Mon Profil', icon: 'person-outline', route: '/agent/profile', isParent: false }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {
    addIcons({
      homeOutline, listOutline, logOutOutline,
      sendOutline, personCircleOutline, personOutline, documentTextOutline,
      chevronDownOutline, chevronForwardOutline
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

  toggleSubMenu(item: any): void {
    item.expanded = !item.expanded;
  }

  isRouteActive(route: string): boolean {
    return this.router.url === route;
  }

  goToProfile(): void {
    this.router.navigate(['/agent/profile']);
  }

  onLogout(event: Event): void {
    event.stopPropagation();
    this.authService.logout();
  }

  logout() {
    this.authService.logout();
  }
}