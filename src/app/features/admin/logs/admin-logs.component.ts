import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, ActivityLog } from '../../../core/services/user.service';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-admin-logs',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    TagModule,
    ButtonModule,
    InputTextModule
  ],
  templateUrl: './admin-logs.component.html',
  styleUrls: ['./admin-logs.component.css']
})
export class AdminLogsComponent implements OnInit {

  logs: ActivityLog[] = [];
  loading = true;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.loading = true;
    this.userService.getLogs().subscribe({
      next: (data) => {
        this.logs = data;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
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