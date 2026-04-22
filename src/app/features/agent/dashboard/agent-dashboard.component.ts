import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { environment } from '../../../../environments/environment';
import { forkJoin } from 'rxjs';
import { filter, Subscription } from 'rxjs';

export interface DashboardStats {
  totalTransactions: number;
  enAttente: number;
  acceptees: number;
  rejetees: number;
  signalees: number;
  montantTotal: number;
  montantMoyen: number;
}

export interface RecentTransaction {
  id: number;
  msgId: string;
  uetr: string;
  amount: number;
  currency: string;
  debtorName: string;
  creditorName: string;
  creditorCountry: string;
  status: string;
  receivedAt: string;
}

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    ChartModule,
    TableModule,
    TagModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './agent-dashboard.component.html',
  styleUrls: ['./agent-dashboard.component.css']
})
export class AgentDashboardComponent implements OnInit, OnDestroy {

  loading = false;
  
  stats: DashboardStats = {
    totalTransactions: 0,
    enAttente: 0,
    acceptees: 0,
    rejetees: 0,
    signalees: 0,
    montantTotal: 0,
    montantMoyen: 0
  };

  recentTransactions: RecentTransaction[] = [];
  chartData: any;
  chartOptions: any;

  private readonly API = `${environment.apiUrl}/api/agent`;
  private routerSubscription: Subscription;

  constructor(
    private http: HttpClient,
    private router: Router,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.initChart();
    
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
    console.log('Loading dashboard data...');
    forkJoin({
      stats: this.http.get<DashboardStats>(`${this.API}/dashboard/stats`),
      transactions: this.http.get<RecentTransaction[]>(`${this.API}/messages/recent?limit=5`)
    }).subscribe({
      next: (results) => {
        console.log('Data loaded:', results);
        this.stats = results.stats;
        this.recentTransactions = results.transactions;
        this.initChart();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.cdr.detectChanges();
      }
    });
  }

  initChart(): void {
    this.chartData = {
      labels: ['En attente', 'Acceptées', 'Rejetées', 'Signalées'],
      datasets: [{
        data: [
          this.stats.enAttente,
          this.stats.acceptees,
          this.stats.rejetees,
          this.stats.signalees
        ],
        backgroundColor: ['#f59e0b', '#10b981', '#ef4444', '#6366f1'],
        hoverBackgroundColor: ['#d97706', '#059669', '#dc2626', '#4f46e5'],
        borderWidth: 0
      }]
    };

    this.chartOptions = {
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Plus Jakarta Sans', size: 12 } } },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = this.stats.totalTransactions;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    };
  }

  viewAllTransactions(): void {
    this.router.navigate(['/agent/logs']);
  }

  viewTransaction(id: number): void {
    this.router.navigate(['/agent/transactions', id]);
  }

  getStatusSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" {
    switch (status) {
      case 'EN_ATTENTE': return 'warn';
      case 'ACCEPTE': return 'success';
      case 'REJETE': return 'danger';
      case 'SIGNALE': return 'info';
      default: return 'secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'EN_ATTENTE': return 'En attente';
      case 'ACCEPTE': return 'Accepté';
      case 'REJETE': return 'Rejeté';
      case 'SIGNALE': return 'Signalé';
      default: return status;
    }
  }
}