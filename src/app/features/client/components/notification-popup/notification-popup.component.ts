import { Component, OnInit, OnDestroy, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TransferService, ClientNotification } from '../../services/transfer.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-popup',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="notification-container">
      <div class="notification-dropdown">
        <div class="dropdown-header">
          <span>Notifications</span>
          <button *ngIf="unreadCount > 0" class="mark-all" (click)="markAllAsRead($event)">
            Tout marquer comme lu
          </button>
        </div>

        <div class="dropdown-content">
          <div *ngIf="notifications.length === 0" class="empty">
            🔔 Aucune notification
          </div>
          
          <div *ngFor="let notif of notifications" 
               class="notification-item" 
               [class.unread]="!notif.read"
               (click)="onNotificationClick(notif)">
            <div class="notif-icon">{{ getTypeIcon(notif.type) }}</div>
            <div class="notif-content">
              <div class="notif-title">{{ notif.title }}</div>
              <div class="notif-message">{{ notif.message }}</div>
              <div class="notif-time">{{ getTimeAgo(notif.date || notif.createdAt) }}</div>
            </div>
            <button *ngIf="!notif.read" class="mark-read" (click)="markAsRead(notif.id, $event)">✓</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-container { position: relative; width: 100%; }
    .notification-dropdown { width: 380px; max-height: 500px; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); overflow: hidden; }
    .dropdown-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; background: white; }
    .mark-all { background: none; border: none; color: #667eea; font-size: 12px; cursor: pointer; }
    .mark-all:hover { text-decoration: underline; }
    .dropdown-content { max-height: 420px; overflow-y: auto; }
    .notification-item { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background 0.2s; }
    .notification-item:hover { background: #f8fafc; }
    .notification-item.unread { background: #eff6ff; }
    .notif-icon { font-size: 20px; flex-shrink: 0; }
    .notif-content { flex: 1; }
    .notif-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #1e293b; }
    .notif-message { font-size: 12px; color: #64748b; margin-bottom: 4px; line-height: 1.4; }
    .notif-time { font-size: 10px; color: #94a3b8; }
    .mark-read { background: #667eea; color: white; border: none; border-radius: 20px; padding: 4px 10px; font-size: 11px; cursor: pointer; flex-shrink: 0; }
    .mark-read:hover { background: #5a4fcf; }
    .empty { text-align: center; padding: 40px; color: #94a3b8; }
  `]
})
export class NotificationPopupComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  
  notifications: ClientNotification[] = [];
  unreadCount = 0;
  private subscriptions: Subscription[] = [];

  constructor(private transferService: TransferService) {}

  ngOnInit() {
    this.loadNotifications();
    this.loadUnreadCount();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadNotifications() {
    const sub = this.transferService.getNotifications().subscribe({
      next: (data: ClientNotification[]) => {
        const uniqueMap = new Map<number, ClientNotification>();
        data.forEach(notif => {
          if (!uniqueMap.has(notif.id)) {
            uniqueMap.set(notif.id, notif);
          }
        });
        this.notifications = Array.from(uniqueMap.values());
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

  onNotificationClick(notif: ClientNotification) {
    if (!notif.read) {
      this.markAsRead(notif.id, new Event('click'));
    }
    if (notif.uetr) {
      this.close.emit();
      window.location.href = `/client/tracking?uetr=${notif.uetr}`;
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
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
    return `${Math.floor(diff / 86400)} j`;
  }
}