import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';

export interface NotifPrefs {
  onUserAdd:      boolean;
  onUserDelete:   boolean;
  onStatusChange: boolean;
  onSystemAlert:  boolean;
}

@Injectable({ providedIn: 'root' })
export class NotifPrefsService {

  private readonly API      = 'http://localhost:8081/api/admin/profile';
  private readonly STORAGE  = 'admin_prefs';

  private prefs: NotifPrefs = {
    onUserAdd:      true,
    onUserDelete:   true,
    onStatusChange: true,
    onSystemAlert:  true,
  };

  constructor(private http: HttpClient) {
    this.load();
  }

  /** Called once at startup — loads prefs from backend (or localStorage fallback) */
  load(): void {
    this.http.get<any>(this.API).subscribe({
      next: (dto) => {
        this.prefs = {
          onUserAdd:      dto.notifUserAdd      ?? true,
          onUserDelete:   dto.notifUserDelete   ?? true,
          onStatusChange: dto.notifStatusChange ?? true,
          onSystemAlert:  dto.notifSystemAlert  ?? true,
        };
      },
      error: () => {
        // Fallback: read from localStorage
        const saved = localStorage.getItem(this.STORAGE);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.notifPrefs) {
              this.prefs = { ...this.prefs, ...parsed.notifPrefs };
            }
          } catch { /* ignore */ }
        }
      }
    });
  }

  /** Update prefs in memory after saving from profile page */
  update(prefs: NotifPrefs): void {
    this.prefs = { ...prefs };
  }

  // ── Conditional toast helpers ──────────────────────────────

  /**
   * Shows a toast only if the matching pref is ON.
   * Use this instead of messageService.add() everywhere in the app.
   */
  notifyUserAdd(messageService: MessageService, detail: string): void {
    if (this.prefs.onUserAdd) {
      messageService.add({ severity: 'success', summary: 'Utilisateur créé', detail, life: 4000 });
    }
  }

  notifyUserDelete(messageService: MessageService, detail: string): void {
    if (this.prefs.onUserDelete) {
      messageService.add({ severity: 'success', summary: 'Supprimé', detail, life: 4000 });
    }
  }

  notifyStatusChange(messageService: MessageService, detail: string, wasActive: boolean): void {
    if (this.prefs.onStatusChange) {
      messageService.add({
        severity: wasActive ? 'warn' : 'success',
        summary:  wasActive ? 'Désactivé' : 'Activé',
        detail,
        life: 4000
      });
    }
  }

  notifySystemAlert(messageService: MessageService, detail: string): void {
    if (this.prefs.onSystemAlert) {
      messageService.add({ severity: 'error', summary: 'Erreur système', detail, life: 4000 });
    }
  }

  // ── Getters (for debugging / display) ─────────────────────
  getPrefs(): NotifPrefs { return { ...this.prefs }; }
  canNotifyUserAdd():      boolean { return this.prefs.onUserAdd; }
  canNotifyUserDelete():   boolean { return this.prefs.onUserDelete; }
  canNotifyStatusChange(): boolean { return this.prefs.onStatusChange; }
  canNotifySystemAlert():  boolean { return this.prefs.onSystemAlert; }
}