import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { UserService, AppUser } from '../../../core/services/user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    SelectModule
  ],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit {

  @Input() user: AppUser | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  visible = true;
  loading = false;
  errorMessage = '';
  fieldErrors: Record<string, string> = {};
  showOtherCountryInput = false;
  originalIban = '';
  ibanLocked = false;

  formData = {
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: '',
    actif: 1,
    phone: '',
    birthDate: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    otherCountry: '',
    iban: ''
  };

  roles = [
    { label: 'Back-Office', value: 'BACK_OFFICE' },
    { label: 'Client', value: 'CLIENT' },
    { label: 'Admin', value: 'Admin' }
  ];

  statusOptions = [
    { label: 'Actif', value: 1 },
    { label: 'Inactif', value: 0 }
  ];

  countries = [
    { label: 'Tunisie', value: 'TN' },
    { label: 'France', value: 'FR' },
    { label: 'Belgique', value: 'BE' },
    { label: 'Suisse', value: 'CH' },
    { label: 'Maroc', value: 'MA' },
    { label: 'Algérie', value: 'DZ' },
    { label: 'Sénégal', value: 'SN' },
    { label: "Côte d'Ivoire", value: 'CI' },
    { label: 'Canada', value: 'CA' },
    { label: 'Autre', value: 'OTHER' }
  ];

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Initialisation par défaut
    this.ibanLocked = false;
    this.originalIban = '';

    if (this.user) {
      // Mode édition
      const u = this.user as any;
      let countryValue = u.country || '';
      let otherCountry = '';
      const predefined = this.countries.some(c => c.value === countryValue);

      if (countryValue && !predefined && countryValue !== 'OTHER') {
        otherCountry = countryValue;
        countryValue = 'OTHER';
        this.showOtherCountryInput = true;
      } else if (countryValue === 'OTHER') {
        this.showOtherCountryInput = true;
        otherCountry = u.otherCountry || '';
      }

      this.originalIban = u.iban || '';
      this.ibanLocked = true; // En édition, IBAN verrouillé

      this.formData = {
        username: u.username || '',
        email: u.email || '',
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        role: u.role || '',
        actif: u.actif ?? 1,
        phone: u.phone || '',
        birthDate: u.birthDate || '',
        address: u.address || '',
        city: u.city || '',
        postalCode: u.postalCode || '',
        country: countryValue,
        otherCountry: otherCountry,
        iban: this.originalIban
      };
    } else {
      // Mode création
      this.showOtherCountryInput = false;
      this.formData = {
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        role: '',
        actif: 1,
        phone: '',
        birthDate: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        otherCountry: '',
        iban: ''
      };
    }

    this.cdr.detectChanges();
  }

  get isEdit(): boolean {
    return !!this.user;
  }

  /**
   * Gère la saisie de l'IBAN avec verrouillage automatique à 34 caractères
   */
  onIbanInput(): void {
    if (this.isEdit) return;

    // Nettoyer : supprimer espaces, mettre en majuscules
    let cleanIban = this.formData.iban.replace(/\s/g, '').toUpperCase();

    // Limiter à 34 caractères
    if (cleanIban.length > 34) {
      cleanIban = cleanIban.substring(0, 34);
    }

    this.formData.iban = cleanIban;

    // Vérifier si on a atteint 34 caractères
    if (cleanIban.length === 34) {
      // Format IBAN valide ?
      const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$/;
      if (ibanRegex.test(cleanIban)) {
        // Verrouillage automatique et silencieux
        this.ibanLocked = true;
        delete this.fieldErrors['iban'];
      } else {
        this.fieldErrors['iban'] = 'Format IBAN invalide';
      }
    } else {
      this.ibanLocked = false;
      delete this.fieldErrors['iban'];
    }

    this.cdr.detectChanges();
  }

  /**
   * Gère le changement de pays
   */
  onCountryChange(value: string): void {
    this.showOtherCountryInput = (value === 'OTHER');
    if (!this.showOtherCountryInput) {
      this.formData.otherCountry = '';
    }
  }

  /**
   * Valide tous les champs du formulaire
   */
  private validateForm(): boolean {
    this.fieldErrors = {};

    // Username
    if (!this.formData.username?.trim()) {
      this.fieldErrors['username'] = 'Le nom d\'utilisateur est requis';
    } else if (this.formData.username.length < 3) {
      this.fieldErrors['username'] = 'Minimum 3 caractères';
    }

    // Email
    if (!this.formData.email?.trim()) {
      this.fieldErrors['email'] = 'L\'email est requis';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.formData.email)) {
        this.fieldErrors['email'] = 'Email invalide';
      }
    }

    // Rôle
    if (!this.formData.role) {
      this.fieldErrors['role'] = 'Le rôle est requis';
    }

    // Prénom
    if (this.formData.firstName && this.formData.firstName.length < 2) {
      this.fieldErrors['firstName'] = 'Minimum 2 caractères';
    }

    // Téléphone
    if (this.formData.phone) {
      const phoneRegex = /^[+]?[0-9]{8,15}$/;
      if (!phoneRegex.test(this.formData.phone.replace(/\s/g, ''))) {
        this.fieldErrors['phone'] = 'Format invalide (ex: +21612345678)';
      }
    }

    // Autre pays
    if (this.showOtherCountryInput && this.formData.otherCountry) {
      if (this.formData.otherCountry.length > 50) {
        this.fieldErrors['otherCountry'] = 'Trop long (max 50)';
      }
    }

    // IBAN (uniquement pour les clients en création ET non verrouillé)
    if (this.formData.role === 'CLIENT' && !this.isEdit && !this.ibanLocked) {
      if (!this.formData.iban?.trim()) {
        this.fieldErrors['iban'] = 'L\'IBAN est requis';
      } else if (this.formData.iban.length !== 34) {
        this.fieldErrors['iban'] = `L'IBAN doit contenir exactement 34 caractères (${this.formData.iban.length}/34)`;
      }
    }

    return Object.keys(this.fieldErrors).length === 0;
  }

  /**
   * Sauvegarde du formulaire
   */
  onSave(): void {
    if (!this.validateForm()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulaire invalide',
        detail: 'Veuillez corriger les erreurs',
        life: 3000
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    // Traitement du pays
    let finalCountry = this.formData.country;
    if (finalCountry === 'OTHER') {
      finalCountry = this.formData.otherCountry?.trim() || '';
    }

    // Nettoyage de l'IBAN
    const cleanIban = this.formData.iban?.replace(/\s/g, '').toUpperCase() || null;

    if (this.isEdit) {
      // Mode modification (sans IBAN ni mot de passe)
      const updateData: any = {
        username: this.formData.username,
        email: this.formData.email,
        firstName: this.formData.firstName || null,
        lastName: this.formData.lastName || null,
        role: this.formData.role,
        actif: this.formData.actif,
        phone: this.formData.phone || null,
        birthDate: this.formData.birthDate || null,
        address: this.formData.address || null,
        city: this.formData.city || null,
        postalCode: this.formData.postalCode || null,
        country: finalCountry || null
      };

      this.userService.updateUser(this.user!.id, updateData).subscribe({
        next: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Utilisateur modifié',
            life: 3000
          });
          this.saved.emit();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.message || 'Erreur lors de la modification';
          this.cdr.detectChanges();
        }
      });
    } else {
      // Mode création (sans mot de passe - généré par backend)
      const payload: any = {
        username: this.formData.username,
        email: this.formData.email,
        firstName: this.formData.firstName || null,
        lastName: this.formData.lastName || null,
        role: this.formData.role,
        phone: this.formData.phone || null,
        birthDate: this.formData.birthDate || null,
        address: this.formData.address || null,
        city: this.formData.city || null,
        postalCode: this.formData.postalCode || null,
        country: finalCountry || null,
        iban: cleanIban || null
      };

      this.userService.createUser(payload).subscribe({
        next: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Utilisateur créé - Email envoyé',
            life: 5000
          });
          this.saved.emit();
        },
        error: (err) => {
          this.loading = false;
          if (err.status === 409) {
            this.errorMessage = 'Email, nom d\'utilisateur ou IBAN déjà existant';
          } else {
            this.errorMessage = err.error?.message || 'Erreur lors de la création';
          }
          this.cdr.detectChanges();
        }
      });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  hasError(fieldName: string): boolean {
    return !!this.fieldErrors[fieldName];
  }

  getError(fieldName: string): string {
    return this.fieldErrors[fieldName] || '';
  }
}