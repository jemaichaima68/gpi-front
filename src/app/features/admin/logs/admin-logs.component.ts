import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, ActivityLog } from '../../../core/services/user.service';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-admin-logs',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './admin-logs.component.html',
  styleUrls: ['./admin-logs.component.css']
})
export class AdminLogsComponent implements OnInit {

  logs: ActivityLog[] = [];
  loading = true;

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.loading = true;
    this.userService.getLogs().subscribe({
      next: (data) => {
        this.logs = data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement logs:', err);
        this.loading = false;
        this.cdr.detectChanges();
        
        // Données mockées enrichies
        this.logs = this.getMockLogs();
        
        this.messageService.add({
          severity: 'warn',
          summary: 'Mode démonstration',
          detail: 'Affichage de logs de démonstration',
          life: 3000
        });
      }
    });
  }

  private getMockLogs(): ActivityLog[] {
    const now = new Date();
    return [
      {
        id: '1',
        action: 'CREATE',
        entityType: 'USER',
        entityId: 'user-001',
        description: 'Utilisateur CLI cliente créé avec le rôle CLIENT',
        performedBy: 'admin1',
        dateAction: new Date(now.getTime() - 2 * 3600000).toISOString()
      },
      {
        id: '2',
        action: 'CREATE',
        entityType: 'USER',
        entityId: 'user-002',
        description: 'Utilisateur boshra jemai créé avec le rôle CLIENT',
        performedBy: 'admin1',
        dateAction: new Date(now.getTime() - 8 * 3600000).toISOString()
      },
      {
        id: '3',
        action: 'UPDATE',
        entityType: 'USER',
        entityId: 'user-003',
        description: 'Utilisateur shaima jemai modifié - rôle BACK_OFFICE',
        performedBy: 'admin1',
        dateAction: new Date(now.getTime() - 2 * 86400000).toISOString()
      },
      {
        id: '4',
        action: 'CREATE',
        entityType: 'USER',
        entityId: 'user-004',
        description: 'Utilisateur agent créé avec le rôle BACK_OFFICE',
        performedBy: 'admin1',
        dateAction: new Date(now.getTime() - 3 * 86400000).toISOString()
      },
      {
        id: '5',
        action: 'DEACTIVATE',
        entityType: 'USER',
        entityId: 'user-005',
        description: 'Utilisateur test désactivé',
        performedBy: 'admin1',
        dateAction: new Date(now.getTime() - 5 * 86400000).toISOString()
      },
      {
        id: '6',
        action: 'DELETE',
        entityType: 'USER',
        entityId: 'user-006',
        description: 'Utilisateur ancien_agent supprimé',
        performedBy: 'admin1',
        dateAction: new Date(now.getTime() - 7 * 86400000).toISOString()
      },
      {
        id: '7',
        action: 'UPDATE',
        entityType: 'SETTINGS',
        entityId: 'settings-001',
        description: 'Paramètres plateforme mis à jour (plafonds, devises)',
        performedBy: 'admin1',
        dateAction: new Date(now.getTime() - 10 * 86400000).toISOString()
      }
    ];
  }

  getActionSeverity(action: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (action) {
      case 'CREATE':     return 'success';
      case 'UPDATE':     return 'info';
      case 'ACTIVATE':   return 'success';
      case 'DEACTIVATE': return 'warn';
      case 'DELETE':     return 'danger';
      default:           return 'secondary';
    }
  }

  getActionLabel(action: string): string {
    switch (action) {
      case 'CREATE':     return 'Création';
      case 'UPDATE':     return 'Modification';
      case 'ACTIVATE':   return 'Activation';
      case 'DEACTIVATE': return 'Désactivation';
      case 'DELETE':     return 'Suppression';
      default:           return action;
    }
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'CREATE':     return 'pi pi-plus-circle';
      case 'UPDATE':     return 'pi pi-pencil';
      case 'ACTIVATE':   return 'pi pi-check-circle';
      case 'DEACTIVATE': return 'pi pi-ban';
      case 'DELETE':     return 'pi pi-trash';
      default:           return 'pi pi-info-circle';
    }
  }
}