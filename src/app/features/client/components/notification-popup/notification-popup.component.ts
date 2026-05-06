import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TransferService, ClientNotification } from '../../services/transfer.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-popup.component.html',
  styleUrls: ['./notification-popup.component.css']
})
export class NotificationPopupComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  
  isOpen = true;  // ← Popup toujours ouverte quand affichée
  notifications: ClientNotification[] = [];
  unreadCount = 0;
  private subscriptions: Subscription[] = [];

  constructor(
    private transferService: TransferService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadNotifications();
    this.loadUnreadCount();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ✅ Cette méthode est appelée par la cloche dans le parent
  // Mais dans ce composant, on n'a PAS de cloche
  // La cloche est dans ClientLayoutComponent
  
  closePopup() {
    this.close.emit();  // ← Ferme la popup (cache le composant)
  }

  loadNotifications() {
    const sub = this.transferService.getNotifications().subscribe({
      next: (data: ClientNotification[]) => {
        // Filtrer les doublons par UETR
        const uniqueMap = new Map<string, ClientNotification>();
        data.forEach(notif => {
          const key = notif.uetr || notif.id.toString();
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, notif);
          }
        });
        this.notifications = Array.from(uniqueMap.values());
        
        // Trier par date décroissante
        this.notifications.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || '');
          const dateB = new Date(b.createdAt || b.date || '');
          return dateB.getTime() - dateA.getTime();
        });
      },
      error: (err: any) => console.error('Erreur chargement notifications', err)
    });
    this.subscriptions.push(sub);
  }

  loadUnreadCount() {
    const sub = this.transferService.getUnreadCount().subscribe({
      next: (count: number) => this.unreadCount = count,
      error: (err: any) => console.error('Erreur compteur', err)
    });
    this.subscriptions.push(sub);
  }

  markAsRead(id: number, event: Event) {
    event.stopPropagation();
    const sub = this.transferService.markNotificationRead(id).subscribe({
      next: () => {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index !== -1) {
          this.notifications[index] = { ...this.notifications[index], read: true };
        }
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      },
      error: (err: any) => console.error('Erreur', err)
    });
    this.subscriptions.push(sub);
  }

  markAllAsRead(event: Event) {
    event.stopPropagation();
    const sub = this.transferService.markAllNotificationsAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map(n => ({ ...n, read: true }));
        this.unreadCount = 0;
      },
      error: (err: any) => console.error('Erreur', err)
    });
    this.subscriptions.push(sub);
  }

  // ✅ Click sur une notification
  onNotificationClick(notif: ClientNotification) {
    if (!notif.read) {
      this.markAsRead(notif.id, new Event('click'));
    }
    if (notif.uetr) {
      this.closePopup();  // ← Ferme la popup avant navigation
      this.router.navigate(['/client/tracking'], { queryParams: { uetr: notif.uetr } });
    }
  }

  getTypeIcon(type: string): string {
    switch(type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📢';
    }
  }

  getTimeAgo(dateStr: string): string {
    if (!dateStr || dateStr === '') return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const now = new Date();
      const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diff < 60) return 'À l\'instant';
      if (diff < 3600) return `${Math.floor(diff / 60)} min`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
      return `${Math.floor(diff / 86400)} j`;
    } catch (e) {
      return '';
    }
  }
}