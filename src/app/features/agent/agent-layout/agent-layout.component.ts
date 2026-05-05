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
  IonFooter, IonButtons, IonMenuButton  // ✅ AJOUTER ICI
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, listOutline, logOutOutline,
  sendOutline, personCircleOutline, personOutline,
  documentTextOutline, checkmarkCircleOutline,
  chevronDownOutline, chevronForwardOutline,
  menuOutline  // ✅ AJOUTER menuOutline
} from 'ionicons/icons';

interface MenuItem {
  label: string;
  icon: string;
  route?: string | null;
  isParent?: boolean;
  expanded?: boolean;
  children?: MenuItem[];
}

@Component({
  selector: 'app-agent-layout',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ToastModule, BadgeModule, ButtonModule,
    IonApp, IonSplitPane, IonMenu, IonHeader, IonToolbar, IonTitle,
    IonContent, IonList, IonItem, IonIcon, IonLabel, IonMenuToggle,
    IonFooter, IonButtons, IonMenuButton  // ✅ AJOUTER ICI AUSSI
  ],
  providers: [MessageService],
  templateUrl: './agent-layout.component.html',
  styleUrls: ['./agent-layout.component.css']
})
export class AgentLayoutComponent implements OnInit {

  username = '';
  avatarInitials = 'A';

  menuItems: MenuItem[] = [
    { label: 'Tableau de bord', icon: 'home-outline', route: '/agent/dashboard' },
    { 
      label: 'Transactions', 
      icon: 'list-outline', 
      route: null,
      isParent: true,
      expanded: false,
      children: [
        { label: 'Messages reçus', icon: 'send-outline', route: '/agent/transactions/recus' },
        { label: 'Messages émis', icon: 'document-text-outline', route: '/agent/transactions/emis' },
        { label: 'Transactions traitées', icon: 'checkmark-circle-outline', route: '/agent/transactions/traitees' }
      ]
    },
    { label: 'Logs activité', icon: 'document-text-outline', route: '/agent/logs' }
  ];

  bottomItems: MenuItem[] = [
    { label: 'Mon Profil', icon: 'person-outline', route: '/agent/profile' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {
    addIcons({
      homeOutline, listOutline, logOutOutline,
      sendOutline, personCircleOutline, personOutline,
      documentTextOutline, checkmarkCircleOutline,
      chevronDownOutline, chevronForwardOutline,
      menuOutline
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
    this.router.navigate(['/agent/profile']);
  }

  onLogout(event: Event): void {
    event.stopPropagation();
    this.authService.logout();
  }

  toggleSubMenu(item: MenuItem): void {
    if (item.isParent) {
      item.expanded = !item.expanded;
    }
  }
}