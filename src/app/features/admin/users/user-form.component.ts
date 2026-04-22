import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { UserService, AppUser, UserCreateRequest } from '../../../core/services/user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    MessageModule,
    PasswordModule
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

  formData = {
    username:   '',
    email:      '',
    firstName:  '',
    lastName:   '',
    role:       '',
    password:   '',
    actif:      1,
    phone:      '',
    birthDate:  '',
    address:    '',
    city:       '',
    postalCode: '',
    country:    '',
    otherCountry: ''
  };

  roles = [
    { label: 'Back-Office', value: 'BACK_OFFICE' },
    { label: 'Client',      value: 'CLIENT'      },
    { label: 'Admin',       value: 'Admin'       }
  ];

  statusOptions = [
    { label: 'Actif',   value: 1 },
    { label: 'Inactif', value: 0 }
  ];

  countries = [
    { label: 'Tunisie',       value: 'TN' },
    { label: 'France',        value: 'FR' },
    { label: 'Belgique',      value: 'BE' },
    { label: 'Suisse',        value: 'CH' },
    { label: 'Maroc',         value: 'MA' },
    { label: 'Algérie',       value: 'DZ' },
    { label: 'Sénégal',       value: 'SN' },
    { label: "Côte d'Ivoire", value: 'CI' },
    { label: 'Canada',        value: 'CA' },
    { label: 'Autre',         value: 'OTHER' }
  ];

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.user) {
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
      this.formData = {
        username:   u.username   ?? '',
        email:      u.email      ?? '',
        firstName:  u.firstName  ?? '',
        lastName:   u.lastName   ?? '',
        role:       u.role       ?? '',
        password:   '',
        actif:      u.actif      ?? 1,
        phone:      u.phone      ?? '',
        birthDate:  u.birthDate  ?? '',
        address:    u.address    ?? '',
        city:       u.city       ?? '',
        postalCode: u.postalCode ?? '',
        country:    countryValue,
        otherCountry: otherCountry
      };
    }
  }

  get isEdit(): boolean {
    return !!this.user;
  }

  onCountryChange(value: string) {
    this.showOtherCountryInput = (value === 'OTHER');
    if (!this.showOtherCountryInput) {
      this.formData.otherCountry = '';
    }
  }

  private validateForm(): boolean {
    this.fieldErrors = {};
    
    if (!this.formData.username?.trim()) {
      this.fieldErrors['username'] = 'Le nom d\'utilisateur est requis';
    } else if (this.formData.username.length < 3) {
      this.fieldErrors['username'] = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
    }
    
    if (!this.formData.email?.trim()) {
      this.fieldErrors['email'] = 'L\'adresse email est requise';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.formData.email)) {
        this.fieldErrors['email'] = 'Format d\'email invalide (ex: nom@domaine.com)';
      }
    }
    
    if (!this.formData.role) {
      this.fieldErrors['role'] = 'Le rôle est requis';
    }
    
    if (!this.isEdit) {
      if (!this.formData.password) {
        this.fieldErrors['password'] = 'Le mot de passe temporaire est requis';
      } else if (this.formData.password.length < 6) {
        this.fieldErrors['password'] = 'Le mot de passe doit contenir au moins 6 caractères';
      }
    }
    
    if (this.formData.firstName && this.formData.firstName.length < 2) {
      this.fieldErrors['firstName'] = 'Le prénom doit contenir au moins 2 caractères';
    }
    
    if (this.formData.phone) {
      const phoneRegex = /^[+]?[0-9]{8,15}$/;
      if (!phoneRegex.test(this.formData.phone.replace(/\s/g, ''))) {
        this.fieldErrors['phone'] = 'Format de téléphone invalide (ex: +21612345678)';
      }
    }

    // Validation du pays personnalisé
    if (this.showOtherCountryInput && this.formData.otherCountry) {
      const MAX_COUNTRY_LENGTH = 50;
      if (this.formData.otherCountry.length > MAX_COUNTRY_LENGTH) {
        this.fieldErrors['otherCountry'] = `Le nom du pays ne peut pas dépasser ${MAX_COUNTRY_LENGTH} caractères`;
      }
    }
    
    this.cdr.detectChanges();
    return Object.keys(this.fieldErrors).length === 0;
  }

  onSave() {
    if (!this.validateForm()) return;
    
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    // Construire la valeur du pays : si "OTHER", utiliser otherCountry sinon la valeur sélectionnée
    let finalCountry = this.formData.country;
    if (finalCountry === 'OTHER') {
      finalCountry = this.formData.otherCountry?.trim() || '';
    }
    
    // Tronquer à 50 caractères (limite de la colonne country en base)
    const MAX_COUNTRY_LENGTH = 50;
    if (finalCountry && finalCountry.length > MAX_COUNTRY_LENGTH) {
      finalCountry = finalCountry.substring(0, MAX_COUNTRY_LENGTH);
      this.messageService.add({
        severity: 'warn',
        summary: 'Pays tronqué',
        detail: `Le nom du pays a été raccourci à ${MAX_COUNTRY_LENGTH} caractères.`,
        life: 3000
      });
    }

    // ⚠️ Ne PAS envoyer otherCountry – la colonne n'existe pas en base
    const extra = {
      phone:      this.formData.phone      || undefined,
      birthDate:  this.formData.birthDate  || undefined,
      address:    this.formData.address    || undefined,
      city:       this.formData.city       || undefined,
      postalCode: this.formData.postalCode || undefined,
      country:    finalCountry || undefined
    };

    if (this.isEdit) {
      this.userService.updateUser(this.user!.id, {
        username:  this.formData.username,
        email:     this.formData.email,
        firstName: this.formData.firstName,
        lastName:  this.formData.lastName,
        role:      this.formData.role,
        actif:     this.formData.actif,
        ...extra
      }).subscribe({
        next: () => {
          this.loading = false;
          this.cdr.detectChanges();
          this.saved.emit();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.message || err.error || 'Erreur lors de la modification';
          this.cdr.detectChanges();
        }
      });
    } else {
      const payload: UserCreateRequest = {
        username:  this.formData.username,
        email:     this.formData.email,
        firstName: this.formData.firstName,
        lastName:  this.formData.lastName,
        role:      this.formData.role,
        password:  this.formData.password,
        ...extra
      };
      this.userService.createUser(payload).subscribe({
        next: () => {
          this.loading = false;
          this.cdr.detectChanges();
          this.saved.emit();
        },
        error: (err) => {
          this.loading = false;
          if (err.error && typeof err.error === 'string') {
            this.errorMessage = err.error;
          } else if (err.error?.message) {
            this.errorMessage = err.error.message;
          } else if (err.status === 409) {
            this.errorMessage = 'Cet email ou nom d\'utilisateur existe déjà.';
          } else {
            this.errorMessage = 'Erreur lors de la création. Vérifiez les informations.';
          }
          this.cdr.detectChanges();
        }
      });
    }
  }

  onCancel() {
    this.cancelled.emit();
  }
  
  hasError(fieldName: string): boolean {
    return !!this.fieldErrors[fieldName];
  }
  
  getError(fieldName: string): string {
    return this.fieldErrors[fieldName] || '';
  }
}