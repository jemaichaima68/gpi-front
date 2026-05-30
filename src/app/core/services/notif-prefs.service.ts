import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

export interface NotifPrefs {
  onUserAdd:      boolean;
  onUserDelete:   boolean;
  onStatusChange: boolean;
  onSystemAlert:  boolean;
}

@Injectable({ providedIn: 'root' })
export class NotifPrefsService {

  private readonly STORAGE_KEY = 'admin_notif_prefs';

  private prefs: NotifPrefs = {
    onUserAdd:      true,
    onUserDelete:   true,
    onStatusChange: true,
    onSystemAlert:  true,
  };

  constructor() {
    this.load();
  }

  /**
   * Charge les préférences depuis localStorage
   */
  load(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.prefs = {
          onUserAdd:      parsed.onUserAdd ?? true,
          onUserDelete:   parsed.onUserDelete ?? true,
          onStatusChange: parsed.onStatusChange ?? true,
          onSystemAlert:  parsed.onSystemAlert ?? true,
        };
      } catch (e) {
        console.warn('Erreur chargement préférences:', e);
      }
    }
  }

  /**
   * Sauvegarde les préférences dans localStorage
   */
  save(prefs: NotifPrefs): void {
    this.prefs = { ...prefs };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.prefs));
  }

  /**
   * Met à jour les préférences (alias de save)
   */
  update(prefs: NotifPrefs): void {
    this.save(prefs);
  }

  // ── Conditional toast helpers ──────────────────────────────

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

  // ── Getters ────────────────────────────────────────────────
  getPrefs(): NotifPrefs { return { ...this.prefs }; }
  canNotifyUserAdd():      boolean { return this.prefs.onUserAdd; }
  canNotifyUserDelete():   boolean { return this.prefs.onUserDelete; }
  canNotifyStatusChange(): boolean { return this.prefs.onStatusChange; }
  canNotifySystemAlert():  boolean { return this.prefs.onSystemAlert; }
}