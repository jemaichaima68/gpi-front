import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SplitButtonModule } from 'primeng/splitbutton';
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
import { NotifPrefsService } from '../../../core/services/notif-prefs.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-user-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, SplitButtonModule,
    TableModule, TagModule, ToastModule, TooltipModule,
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

  exportOptions = [
    { label: 'CSV', icon: 'pi pi-file-excel', command: () => this.exportCsv() },
    { label: 'PDF', icon: 'pi pi-file-pdf',   command: () => this.exportPdf() }
  ];

  constructor(
    private userService:         UserService,
    private messageService:      MessageService,
    private confirmationService: ConfirmationService,
    private cdr:                 ChangeDetectorRef,
    private notifPrefs:          NotifPrefsService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.applyFilters();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
        this.notifPrefs.notifySystemAlert(
          this.messageService,
          'Impossible de charger les utilisateurs.'
        );
      }
    });
  }

  applyFilters() {
    const q = this.searchQuery.toLowerCase().trim();
    const role = this.selectedRole;
    const status = this.selectedStatus;

    this.filteredUsers = this.users.filter(user => {
      const matchSearch = !q || [
        user.firstName, user.lastName, user.username, user.email
      ].some(field => field?.toLowerCase().includes(q));

      const matchRole = !role || user.role === role;
      const matchStatus = !status || String(user.actif) === status;

      return matchSearch && matchRole && matchStatus;
    });

    this.cdr.markForCheck();
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedRole = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.selectedRole || this.selectedStatus);
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

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `utilisateurs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    this.toast('success', 'Export réussi', `${this.filteredUsers.length} utilisateur(s) exporté(s) au format CSV.`);
  }

  exportPdf() {
    const headers = [['Nom complet', "Nom d'utilisateur", 'Email', 'Rôle', 'Statut', 'Créé le']];
    const rows = this.filteredUsers.map(u => [
      `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
      u.username,
      u.email,
      this.getRoleLabel(u.role),
      u.actif === 1 ? 'Actif' : 'Inactif',
      u.dateCreation ? new Date(u.dateCreation).toLocaleDateString('fr-FR') : ''
    ]);

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Liste des utilisateurs', 14, 15);
    doc.setFontSize(10);
    doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 14, 22);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 30,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 30 },
        2: { cellWidth: 50 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25 }
      }
    });

    doc.save(`utilisateurs_${new Date().toISOString().slice(0, 10)}.pdf`);
    this.toast('success', 'Export réussi', `${this.filteredUsers.length} utilisateur(s) exporté(s) au format PDF.`);
  }

  openAddForm() {
    this.selectedUser = null;
    this.showForm = true;
    this.cdr.markForCheck();
  }

  openEditForm(user: AppUser) {
    this.selectedUser = { ...user };
    this.showForm = true;
    this.cdr.markForCheck();
  }

  openViewForm(user: AppUser) {
    this.viewUser = { ...user };
    this.showViewModal = true;
    this.cdr.markForCheck();
  }

  closeViewModal() {
    this.showViewModal = false;
    this.viewUser = null;
    this.cdr.markForCheck();
  }

  toggleStatus(user: AppUser) {
    this.userService.toggleStatus(user.id).subscribe({
      next: () => {
        const wasActive = user.actif === 1;
        this.notifPrefs.notifyStatusChange(this.messageService, `${user.username} mis à jour`, wasActive);
        this.loadUsers();
      },
      error: () => this.notifPrefs.notifySystemAlert(this.messageService, 'Impossible de changer le statut.')
    });
  }

  confirmDelete(user: AppUser) {
    this.confirmationService.confirm({
      message: `Supprimer définitivement <strong>${user.username}</strong> ?<br>Cette action supprimera aussi le compte Keycloak.`,
      header: 'Confirmer la suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteUser(user)
    });
  }

  deleteUser(user: AppUser) {
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.notifPrefs.notifyUserDelete(this.messageService, `${user.username} supprimé avec succès.`);
        this.loadUsers();
      },
      error: () => this.notifPrefs.notifySystemAlert(this.messageService, "Impossible de supprimer l'utilisateur.")
    });
  }

  onFormSaved() {
    this.showForm = false;
    this.cdr.markForCheck();
    this.loadUsers();
    if (this.selectedUser) {
      this.toast('success', 'Succès', 'Utilisateur modifié.');
    } else {
      this.notifPrefs.notifyUserAdd(this.messageService, 'Utilisateur créé et email envoyé.');
    }
  }

  onFormCancelled() {
    this.showForm = false;
    this.cdr.markForCheck();
  }

  getRoleSeverity(role: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (role) {
      case 'Admin': return 'danger';
      case 'BACK_OFFICE': return 'warn';
      case 'CLIENT': return 'info';
      default: return 'secondary';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'Admin': return 'Admin';
      case 'BACK_OFFICE': return 'Back-office';
      case 'CLIENT': return 'Client';
      default: return role;
    }
  }

  private toast(severity: string, summary: string, detail: string) {
    this.messageService.add({ severity, summary, detail, life: 4000 });
  }
}