import { Component, OnInit, Renderer2, Inject } from '@angular/core';
import { CommonModule, DOCUMENT }               from '@angular/common';
import { FormsModule }                          from '@angular/forms';
import { HttpClient }                           from '@angular/common/http';
import { Router }                               from '@angular/router';
import { MessageService }                       from 'primeng/api';
import { ButtonModule }     from 'primeng/button';
import { InputTextModule }  from 'primeng/inputtext';
import { SelectModule }     from 'primeng/select';
import { DividerModule }    from 'primeng/divider';
import { ToastModule }      from 'primeng/toast';
import { AuthService }      from '../../../core/services/auth.service';
import { NotifPrefsService } from '../../../core/services/notif-prefs.service';

// ── Interfaces ───────────────────────────────────────────────────────
export interface AdminProfile {
  firstName:  string;
  lastName:   string;
  username:   string;
  email:      string;
  language:   string;
  timezone:   string;
  theme:      string;
  dateFormat: string;
}

export interface NotifPrefs {
  onUserAdd:      boolean;
  onUserDelete:   boolean;
  onStatusChange: boolean;
  onSystemAlert:  boolean;
  [key: string]: boolean;
}

// ── Component ────────────────────────────────────────────────────────
@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule, SelectModule,
    DividerModule, ToastModule,
  ],
  providers:   [MessageService],
  templateUrl: './admin-profile.component.html',
  styleUrls:   ['./admin-profile.component.css'],
})
export class AdminProfileComponent implements OnInit {

  saving   = false;
  initials = 'A';

  private readonly API = 'http://localhost:8081/api/admin/profile';

  profile: AdminProfile = {
    firstName:  '',
    lastName:   '',
    username:   '',
    email:      '',
    language:   'fr',
    timezone:   'Africa/Tunis',
    theme:      'light',
    dateFormat: 'dd/MM/yyyy',
  };

  notifPrefs: NotifPrefs = {
    onUserAdd:      true,
    onUserDelete:   true,
    onStatusChange: true,
    onSystemAlert:  true,
  };

  languages = [
    { label: 'Français', value: 'fr' },
    { label: 'English',  value: 'en' },
    { label: 'العربية',  value: 'ar' },
  ];

  timezones = [
    { label: 'Africa/Tunis  (UTC+1)',    value: 'Africa/Tunis'     },
    { label: 'Europe/Paris  (UTC+2)',    value: 'Europe/Paris'     },
    { label: 'UTC',                      value: 'UTC'              },
    { label: 'America/New_York (UTC-5)', value: 'America/New_York' },
  ];

  themes = [
    { label: 'Clair',   value: 'light',  icon: 'pi-sun'     },
    { label: 'Sombre',  value: 'dark',   icon: 'pi-moon'    },
    { label: 'Système', value: 'system', icon: 'pi-desktop' },
  ];

  dateFormats = [
    { label: 'dd/MM/yyyy  (ex: 24/03/2026)', value: 'dd/MM/yyyy' },
    { label: 'MM/dd/yyyy  (ex: 03/24/2026)', value: 'MM/dd/yyyy' },
    { label: 'yyyy-MM-dd  (ex: 2026-03-24)', value: 'yyyy-MM-dd' },
  ];

  notifItems = [
    { key: 'onUserAdd',      label: "Ajout d'utilisateur",       sub: 'Notifier à chaque nouveau compte créé', color: '#6C63FF' },
    { key: 'onUserDelete',   label: "Suppression d'utilisateur", sub: 'Notifier à chaque suppression',         color: '#EF4444' },
    { key: 'onStatusChange', label: 'Changement de statut',      sub: 'Activation / désactivation de compte',  color: '#F59E0B' },
    { key: 'onSystemAlert',  label: 'Alertes système',           sub: 'Erreurs et événements critiques',        color: '#EC4899' },
  ];

  constructor(
    private authService:       AuthService,
    private messageService:    MessageService,
    private router:            Router,
    private http:              HttpClient,
    private renderer:          Renderer2,
    private notifPrefsService: NotifPrefsService,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  // ── Lifecycle ────────────────────────────────────────────────────
  ngOnInit(): void {
    this.profile.username  = this.authService.getUsername();
    this.profile.email     = this.authService.getEmail();

    const token = (this.authService as any).keycloak?.tokenParsed as Record<string, string> | undefined;
    this.profile.firstName = token?.['given_name']  ?? '';
    this.profile.lastName  = token?.['family_name'] ?? '';

    this.refreshInitials();

    this.http.get<any>(this.API).subscribe({
      next: (dto) => {
        this.profile.language   = dto.language   ?? this.profile.language;
        this.profile.timezone   = dto.timezone   ?? this.profile.timezone;
        this.profile.theme      = dto.theme      ?? this.profile.theme;
        this.profile.dateFormat = dto.dateFormat ?? this.profile.dateFormat;

        this.notifPrefs.onUserAdd      = dto.notifUserAdd      ?? true;
        this.notifPrefs.onUserDelete   = dto.notifUserDelete   ?? true;
        this.notifPrefs.onStatusChange = dto.notifStatusChange ?? true;
        this.notifPrefs.onSystemAlert  = dto.notifSystemAlert  ?? true;

        this.applyTheme(this.profile.theme);
        this.applyLanguage(this.profile.language);
      },
      error: () => {
        const saved = localStorage.getItem('admin_prefs');
        if (saved) {
          try {
            const p = JSON.parse(saved);
            if (p.profile)    Object.assign(this.profile,    p.profile);
            if (p.notifPrefs) Object.assign(this.notifPrefs, p.notifPrefs);
            this.applyTheme(this.profile.theme);
            this.applyLanguage(this.profile.language);
          } catch { /* ignore */ }
        }
      }
    });
  }

  // ── Avatar ───────────────────────────────────────────────────────
  refreshInitials(): void {
    const f = this.profile.firstName?.charAt(0) ?? '';
    const l = this.profile.lastName?.charAt(0)  ?? '';
    this.initials = (f + l).toUpperCase()
      || this.profile.username?.charAt(0).toUpperCase()
      || 'A';
  }

  getAvatarGradient(): string {
    const gradients = [
      'linear-gradient(135deg, #6C63FF, #3B82F6)',
      'linear-gradient(135deg, #10B981, #06B6D4)',
      'linear-gradient(135deg, #F59E0B, #EF4444)',
      'linear-gradient(135deg, #8B5CF6, #EC4899)',
      'linear-gradient(135deg, #185FA5, #0F6E56)',
    ];
    const idx = (this.profile.username?.charCodeAt(0) ?? 0) % gradients.length;
    return gradients[idx];
  }

  // ── Thème ────────────────────────────────────────────────────────
  onThemeChange(value: string): void {
    this.profile.theme = value;
    this.applyTheme(value);
  }

  private applyTheme(theme: string): void {
    const body        = this.document.body;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const useDark     = theme === 'dark' || (theme === 'system' && prefersDark);

    if (useDark) {
      this.renderer.addClass(body, 'dark-mode');
      this.renderer.setAttribute(body, 'data-theme', 'dark');
    } else {
      this.renderer.removeClass(body, 'dark-mode');
      this.renderer.setAttribute(body, 'data-theme', 'light');
    }
  }

  // ── Langue ───────────────────────────────────────────────────────
  onLanguageChange(lang: string): void {
    this.applyLanguage(lang);
  }

  private applyLanguage(lang: string): void {
    this.renderer.setAttribute(this.document.documentElement, 'lang', lang);
    if (lang === 'ar') {
      this.renderer.setAttribute(this.document.documentElement, 'dir', 'rtl');
    } else {
      this.renderer.setAttribute(this.document.documentElement, 'dir', 'ltr');
    }
  }

  // ── Keycloak ─────────────────────────────────────────────────────
  private getKeycloakAccountUrl(hash = '#/security/signingin'): string {
    const kc = (this.authService as any).keycloak;
    if (kc?.authServerUrl && kc?.realm) {
      const base = kc.authServerUrl.replace(/\/$/, '');
      return `${base}/realms/${kc.realm}/account/${hash}`;
    }
    return `/auth/realms/gpi-tracker-realm/account/${hash}`;
  }

  openKeycloakPassword(): void { window.open(this.getKeycloakAccountUrl('#/security/signingin'), '_blank'); }
  openKeycloak2FA():      void { window.open(this.getKeycloakAccountUrl('#/security/signingin'), '_blank'); }

  // ── Sauvegarde ───────────────────────────────────────────────────
  onSave(): void {
    this.saving = true;

    const payload = {
      language:          this.profile.language,
      timezone:          this.profile.timezone,
      theme:             this.profile.theme,
      dateFormat:        this.profile.dateFormat,
      notifUserAdd:      this.notifPrefs.onUserAdd,
      notifUserDelete:   this.notifPrefs.onUserDelete,
      notifStatusChange: this.notifPrefs.onStatusChange,
      notifSystemAlert:  this.notifPrefs.onSystemAlert,
    };

    this.http.put<any>(this.API, payload).subscribe({
      next: () => {
        // Synchronise le service partagé → actif immédiatement partout dans l'app
        this.notifPrefsService.update({ ...this.notifPrefs });

        localStorage.setItem('admin_prefs', JSON.stringify({
          profile:    {
            language:   this.profile.language,
            timezone:   this.profile.timezone,
            theme:      this.profile.theme,
            dateFormat: this.profile.dateFormat,
          },
          notifPrefs: this.notifPrefs,
        }));

        this.finishSave(true);
      },
      error: () => {
        // Serveur indisponible → sauvegarde locale + sync quand même
        localStorage.setItem('admin_prefs', JSON.stringify({
          profile:    {
            language:   this.profile.language,
            timezone:   this.profile.timezone,
            theme:      this.profile.theme,
            dateFormat: this.profile.dateFormat,
          },
          notifPrefs: this.notifPrefs,
        }));
        this.notifPrefsService.update({ ...this.notifPrefs });
        this.finishSave(false);
      }
    });
  }

  private finishSave(fromServer: boolean): void {
    this.saving = false;
    this.refreshInitials();
    this.messageService.add({
      severity: 'success',
      summary:  'Profil mis à jour',
      detail:   fromServer
        ? 'Vos préférences ont été enregistrées en base de données.'
        : 'Enregistré localement (serveur indisponible).',
      life: 3500,
    });
  }

  // ── Navigation ───────────────────────────────────────────────────
  onCancel(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}