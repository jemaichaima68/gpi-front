import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { filter, Subscription } from 'rxjs';

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  performedBy: string;
  dateAction: string;
}

@Component({
  selector: 'app-agent-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    ToastModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule
  ],
  providers: [MessageService],
  templateUrl: './agent-logs.component.html',
  styleUrls: ['./agent-logs.component.css']
})
export class AgentLogsComponent implements OnInit, OnDestroy {

  loading = false;
  logs: ActivityLog[] = [];
  filteredLogs: ActivityLog[] = [];
  searchTerm = '';

  private readonly API = `${environment.apiUrl}/api/agent/logs`;
  private routerSubscription: Subscription;

  constructor(
    private http: HttpClient,
    private router: Router,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadData();
    });
  }

  ngOnInit(): void {
    // ✅ SUPPRIMER setTimeout - Appel direct
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadData(): void {
    console.log('Loading logs...');
    this.http.get<ActivityLog[]>(this.API).subscribe({
      next: (data) => {
        console.log('Logs loaded:', data.length);
        this.logs = data;
        this.filteredLogs = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.cdr.detectChanges();
      }
    });
  }

  filterLogs(): void {
    if (!this.searchTerm) {
      this.filteredLogs = this.logs;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredLogs = this.logs.filter(log =>
        log.action.toLowerCase().includes(term) ||
        log.entityType?.toLowerCase().includes(term) ||
        log.description?.toLowerCase().includes(term) ||
        log.performedBy?.toLowerCase().includes(term)
      );
    }
  }

  getActionSeverity(action: string): "success" | "info" | "warn" | "danger" | "secondary" {
    switch (action) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'danger';
      case 'ACCEPTE': return 'success';
      case 'REJETE': return 'danger';
      case 'SIGNALE': return 'warn';
      default: return 'secondary';
    }
  }

  getActionLabel(action: string): string {
    switch (action) {
      case 'CREATE': return 'Création';
      case 'UPDATE': return 'Modification';
      case 'DELETE': return 'Suppression';
      case 'ACCEPTE': return 'Accepté';
      case 'REJETE': return 'Rejeté';
      case 'SIGNALE': return 'Signalé';
      default: return action;
    }
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}