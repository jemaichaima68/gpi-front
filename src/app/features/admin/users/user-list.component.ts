import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UserFormComponent } from './user-form.component';
import { UserService, AppUser } from '../../../core/services/user.service';
import { NotifPrefsService } from '../../../core/services/notif-prefs.service'; // ← AJOUT

@Component({
  selector: 'app-user-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, TableModule,
    TagModule, ToastModule, TooltipModule,
    ConfirmDialogModule, SelectModule,
    InputTextModule, IconFieldModule, InputIconModule,
    UserFormComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {

  users:         AppUser[] = [];
  filteredUsers: AppUser[] = [];
  loading        = false;
  showForm       = false;
  selectedUser:  AppUser | null = null;
  viewUser:      AppUser | null = null;
  showViewModal  = false;

  searchQuery    = '';
  selectedRole   = '';
  selectedStatus = '';

  roleOptions = [
    { label: 'Tous les rôles', value: '' },
    { label: 'Admin',          value: 'Admin'       },
    { label: 'Back-Office',    value: 'BACK_OFFICE' },
    { label: 'Client',         value: 'CLIENT'      }
  ];

  statusOptions = [
    { label: 'Tous les statuts', value: ''  },
    { label: 'Actif',            value: '1' },
    { label: 'Inactif',          value: '0' }
  ];

  constructor(
    private userService:         UserService,
    private messageService:      MessageService,
    private confirmationService: ConfirmationService,
    private cdr:                 ChangeDetectorRef,
    private notifPrefs:          NotifPrefsService   // ← AJOUT
  ) {}

  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users   = data;
        this.applyFilters();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
        // Erreur système → contrôlée par le toggle "Alertes système"
        this.notifPrefs.notifySystemAlert(
          this.messageService,
          'Impossible de charger les utilisateurs.'
        );
      }
    });
  }

  applyFilters() {
    const q      = this.searchQuery.toLowerCase().trim();
    const role   = this.selectedRole;
    const status = this.selectedStatus;

    this.filteredUsers = this.users.filter(u => {
      const matchSearch = !q || [
        u.firstName, u.lastName, u.username, u.email
      ].some(v => v?.toLowerCase().includes(q));

      const matchRole   = !role   || u.role === role;
      const matchStatus = !status || String(u.actif) === status;

      return matchSearch && matchRole && matchStatus;
    });

    this.cdr.markForCheck();
  }

  resetFilters() {
    this.searchQuery    = '';
    this.selectedRole   = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  exportCsv() {
    const headers = ['Nom complet', "Nom d'utilisateur", 'Email', 'Rôle', 'Statut', 'Créé le'];
    const rows = this.filteredUsers.map(u => [
      `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
      u.username,
      u.email,
      this.getRoleLabel(u.role),
      u.actif === 1 ? 'Actif' : 'Inactif',
      u.dateCreation ? new Date(u.dateCreation).toLocaleDateString('fr-FR') : ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const bom  = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `utilisateurs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.toast('success', 'Export réussi', `${this.filteredUsers.length} utilisateur(s) exporté(s).`);
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.selectedRole || this.selectedStatus);
  }

  openAddForm()  { this.selectedUser = null;      this.showForm = true; this.cdr.markForCheck(); }
  openEditForm(user: AppUser) { this.selectedUser = { ...user }; this.showForm = true; this.cdr.markForCheck(); }
  openViewForm(user: AppUser) { this.viewUser = { ...user }; this.showViewModal = true; this.cdr.markForCheck(); }
  closeViewModal() { this.showViewModal = false; this.viewUser = null; this.cdr.markForCheck(); }

  toggleStatus(user: AppUser) {
    this.userService.toggleStatus(user.id).subscribe({
      next: () => {
        const wasActive = user.actif === 1;
        // ← Contrôlé par le toggle "Changement de statut"
        this.notifPrefs.notifyStatusChange(
          this.messageService,
          `${user.username} mis à jour`,
          wasActive
        );
        this.loadUsers();
      },
      error: () => this.notifPrefs.notifySystemAlert(
        this.messageService,
        'Impossible de changer le statut.'
      )
    });
  }

  confirmDelete(user: AppUser) {
    this.confirmationService.confirm({
      message:                `Supprimer définitivement <strong>${user.username}</strong> ?<br>Cette action supprimera aussi le compte Keycloak.`,
      header:                 'Confirmer la suppression',
      icon:                   'pi pi-exclamation-triangle',
      acceptLabel:            'Supprimer',
      rejectLabel:            'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteUser(user)
    });
  }

  deleteUser(user: AppUser) {
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        // ← Contrôlé par le toggle "Suppression d'utilisateur"
        this.notifPrefs.notifyUserDelete(
          this.messageService,
          `${user.username} supprimé avec succès.`
        );
        this.loadUsers();
      },
      error: () => this.notifPrefs.notifySystemAlert(
        this.messageService,
        "Impossible de supprimer l'utilisateur."
      )
    });
  }

  onFormSaved() {
    this.showForm = false;
    this.cdr.markForCheck();
    this.loadUsers();

    if (this.selectedUser) {
      // Modification → pas de toggle spécifique, on affiche toujours
      this.toast('success', 'Succès', 'Utilisateur modifié.');
    } else {
      // Création → contrôlé par le toggle "Ajout d'utilisateur"
      this.notifPrefs.notifyUserAdd(
        this.messageService,
        'Utilisateur créé et email envoyé.'
      );
    }
  }

  onFormCancelled() {
    this.showForm = false;
    this.cdr.markForCheck();
  }

  getRoleSeverity(role: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (role) {
      case 'Admin':       return 'danger';
      case 'BACK_OFFICE': return 'warn';
      case 'CLIENT':      return 'info';
      default:            return 'secondary';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'Admin':       return 'Admin';
      case 'BACK_OFFICE': return 'Back-office';
      case 'CLIENT':      return 'Client';
      default:            return role;
    }
  }

  private toast(severity: string, summary: string, detail: string) {
    this.messageService.add({ severity, summary, detail, life: 4000 });
  }
}