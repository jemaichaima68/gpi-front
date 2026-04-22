import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { environment } from '../../../../environments/environment';

export interface AppSettingsDto {
  montantMax: number;
  montantMin: number;
  devisesAutorisees: string[];
  paysSanctionnes: string[];
  delaiTraitementH: number;
}

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.css']
})
export class AdminSettingsComponent implements OnInit {

  loading = true;
  saving = false;

  private readonly API = `${environment.apiUrl}/api/admin/settings`;

  settings: AppSettingsDto = {
    montantMax: 50000,
    montantMin: 1,
    devisesAutorisees: ['EUR', 'USD', 'GBP', 'TND'],
    paysSanctionnes: ['IR', 'KP', 'SY'],
    delaiTraitementH: 48,
  };

  // Champs temporaires pour saisie de nouveaux tags
  newDevise = '';
  newPays = '';

  // Pays sanctionnés : liste de référence (ISO 3166-1 alpha-2)
  countryNames: Record<string, string> = {
    AF: 'Afghanistan',
    AL: 'Albanie',
    BY: 'Biélorussie',
    BI: 'Burundi',
    CF: 'Centrafrique',
    CD: 'Congo RDC',
    CU: 'Cuba',
    ER: 'Érythrée',
    ET: 'Éthiopie',
    GN: 'Guinée',
    GW: 'Guinée-Bissau',
    HT: 'Haïti',
    IR: 'Iran',
    IQ: 'Irak',
    LB: 'Liban',
    LY: 'Libye',
    ML: 'Mali',
    MM: 'Myanmar',
    NI: 'Nicaragua',
    KP: 'Corée du Nord',
    RU: 'Russie',
    SO: 'Somalie',
    SS: 'Soudan du Sud',
    SD: 'Soudan',
    SY: 'Syrie',
    TN: 'Tunisie',
    UA: 'Ukraine',
    VE: 'Venezuela',
    YE: 'Yémen',
    ZW: 'Zimbabwe'
  };

  // Devises disponibles
  allDevises = [
    'EUR', 'USD', 'GBP', 'TND', 'CHF', 'JPY', 'CAD',
    'AUD', 'CNY', 'AED', 'SAR', 'MAD', 'DZD', 'EGP'
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef  // ← AJOUTER
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading = true;
    this.http.get<AppSettingsDto>(this.API).subscribe({
      next: (data) => {
        this.settings = data;
        this.loading = false;
        this.cdr.detectChanges();  // ← FORCER LA DÉTECTION
      },
      error: (err) => {
        console.error('Erreur chargement settings:', err);
        this.loading = false;
        this.cdr.detectChanges();  // ← FORCER LA DÉTECTION
        
        // Données mockées par défaut
        this.settings = {
          montantMax: 50000,
          montantMin: 1,
          devisesAutorisees: ['EUR', 'USD', 'GBP', 'TND'],
          paysSanctionnes: ['IR', 'KP', 'SY'],
          delaiTraitementH: 48,
        };
        
        this.messageService.add({
          severity: 'warn',
          summary: 'Chargement local',
          detail: 'Paramètres par défaut chargés.',
          life: 3000,
        });
      }
    });
  }

  // Devises
  addDevise(): void {
    const v = this.newDevise.trim().toUpperCase();
    if (v && !this.settings.devisesAutorisees.includes(v)) {
      this.settings.devisesAutorisees = [...this.settings.devisesAutorisees, v];
    }
    this.newDevise = '';
  }

  removeDevise(d: string): void {
    this.settings.devisesAutorisees = 
      this.settings.devisesAutorisees.filter(x => x !== d);
  }

  toggleDevise(d: string): void {
    if (this.settings.devisesAutorisees.includes(d)) {
      this.removeDevise(d);
    } else {
      this.settings.devisesAutorisees = [...this.settings.devisesAutorisees, d];
    }
  }

  // Pays
  addPays(): void {
    const v = this.newPays.trim().toUpperCase();
    if (v.length === 2 && !this.settings.paysSanctionnes.includes(v)) {
      this.settings.paysSanctionnes = [...this.settings.paysSanctionnes, v];
    }
    this.newPays = '';
  }

  removePays(p: string): void {
    this.settings.paysSanctionnes = 
      this.settings.paysSanctionnes.filter(x => x !== p);
  }

  getCountryName(code: string): string {
    return this.countryNames[code] ?? code;
  }

  // Sauvegarde
  onSave(): void {
    this.saving = true;
    this.http.put<AppSettingsDto>(this.API, this.settings).subscribe({
      next: (data) => {
        this.settings = data;
        this.saving = false;
        this.cdr.detectChanges();  // ← FORCER LA DÉTECTION
        this.messageService.add({
          severity: 'success',
          summary: 'Paramètres enregistrés',
          detail: 'Les règles métier ont été mises à jour.',
          life: 3500,
        });
      },
      error: () => {
        this.saving = false;
        this.cdr.detectChanges();  // ← FORCER LA DÉTECTION
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de sauvegarder les paramètres.',
          life: 3500,
        });
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  onKeyDevise(e: KeyboardEvent): void {
    if (e.key === 'Enter') this.addDevise();
  }

  onKeyPays(e: KeyboardEvent): void {
    if (e.key === 'Enter') this.addPays();
  }
}