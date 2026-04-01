import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
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
    country:    ''
  };

  roles = [
    { label: 'Back-Office', value: 'BACK_OFFICE' },
    { label: 'Client',      value: 'CLIENT'      },
    { label: 'Admin',      value: 'ADMIN'      },
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
    { label: 'Côte d\'Ivoire', value: 'CI' },
    { label: 'Canada',        value: 'CA' },
    { label: 'Autre',         value: 'OTHER' }
  ];

  constructor(private userService: UserService) {}

  ngOnInit() {
    if (this.user) {
      const u = this.user as any;
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
        country:    u.country    ?? ''
      };
    }
  }

  get isEdit(): boolean {
    return !!this.user;
  }

  onSave() {
    this.loading = true;
    this.errorMessage = '';

    const extra = {
      phone:      this.formData.phone      || undefined,
      birthDate:  this.formData.birthDate  || undefined,
      address:    this.formData.address    || undefined,
      city:       this.formData.city       || undefined,
      postalCode: this.formData.postalCode || undefined,
      country:    this.formData.country    || undefined
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
        next:  () => { this.loading = false; this.saved.emit(); },
        error: () => { this.loading = false; this.errorMessage = 'Erreur lors de la modification'; }
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
        next:  () => { this.loading = false; this.saved.emit(); },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error || 'Erreur lors de la création';
        }
      });
    }
  }

  onCancel() {
    this.cancelled.emit();
  }
}