import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { environment } from '../../../../environments/environment';
import Chart from 'chart.js/auto';

export interface DashboardStatsV2 {
  enAttente: number;
  totalTraitees: number;
  tauxAcceptation: number;
  alertesCritiques: number;
  alertesAttention: number;
}

export interface TodayActivityStats {
  traitees: number;
  acceptees: number;
  rejetees: number;
}

export interface Transaction {
  id: number;
  msgId: string;
  messageType: string;
  uetr: string;
  amount: number;
  currency: string;
  debtorName: string;
  creditorName: string;
  debtorCountry: string;
  creditorCountry: string;
  status: string;
  alerte?: string;
  motifAlerte?: string;
  receivedAt: string;
  rejectionReason?: string;
}

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TableModule,
    TagModule,
    ToastModule,
    DialogModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './agent-dashboard.component.html',
  styleUrls: ['./agent-dashboard.component.css']
})
export class AgentDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  
  @ViewChild('activityChart') chartCanvas!: ElementRef;
  private chartInstance: Chart | null = null;

  loading = false;
  selectedPeriod: 'week' | 'month' = 'week';
  
  stats: DashboardStatsV2 = {
    enAttente: 0,
    totalTraitees: 0,
    tauxAcceptation: 0,
    alertesCritiques: 0,
    alertesAttention: 0
  };
  
  todayStats: TodayActivityStats = {
    traitees: 0,
    acceptees: 0,
    rejetees: 0
  };
  
  recentTransactions: Transaction[] = [];
  pendingTransactions: Transaction[] = [];
  
  private readonly API = `${environment.apiUrl}/api/agent`;
  private refreshInterval: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAllData();
    // Rafraîchissement automatique toutes les 30 secondes
    this.refreshInterval = setInterval(() => {
      if (!this.loading) {
        this.loadAllData(true);
      }
    }, 30000);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.loadChartData();
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  loadAllData(silent: boolean = false): void {
    if (!silent) this.loading = true;
    
    Promise.all([
      this.loadStats(),
      this.loadPendingTransactions(),
      this.loadRecentTransactions(),
      this.loadTodayActivity()
    ]).finally(() => {
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  private loadStats(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<DashboardStatsV2>(`${this.API}/dashboard/stats-v2`).subscribe({
        next: (data) => {
          this.stats = data;
          resolve();
        },
        error: (err) => {
          console.error('Erreur chargement stats:', err);
          resolve();
        }
      });
    });
  }

  private loadPendingTransactions(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<Transaction[]>(`${this.API}/messages/pending?limit=10`).subscribe({
        next: (data) => {
          this.pendingTransactions = data;
          resolve();
        },
        error: (err) => {
          console.error('Erreur chargement pending:', err);
          resolve();
        }
      });
    });
  }

  private loadRecentTransactions(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<Transaction[]>(`${this.API}/messages/recent-processed?limit=5`).subscribe({
        next: (data) => {
          this.recentTransactions = data;
          resolve();
        },
        error: (err) => {
          console.error('Erreur chargement recent:', err);
          resolve();
        }
      });
    });
  }

  private loadTodayActivity(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<TodayActivityStats>(`${this.API}/dashboard/today-stats`).subscribe({
        next: (data) => {
          this.todayStats = data;
          resolve();
        },
        error: (err) => {
          console.error('Erreur chargement today stats:', err);
          resolve();
        }
      });
    });
  }

  loadChartData(): void {
    this.http.get<any>(`${this.API}/dashboard/activity?period=${this.selectedPeriod}`).subscribe({
      next: (data) => {
        this.renderChart(data.labels, data.values);
      },
      error: (err) => {
        console.error('Erreur chargement chart:', err);
        const demoLabels = this.selectedPeriod === 'week' 
          ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
          : ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
        const demoValues = [12, 19, 15, 17, 14, 10, 8];
        this.renderChart(demoLabels, demoValues.slice(0, demoLabels.length));
      }
    });
  }

  private renderChart(labels: string[], values: number[]): void {
    if (!this.chartCanvas) return;
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
    
    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Transactions traitées',
            data: values,
            backgroundColor: 'rgba(79, 70, 229, 0.75)',
            borderRadius: 8,
            barPercentage: 0.65,
            categoryPercentage: 0.8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { 
            backgroundColor: '#1f2937',
            titleColor: '#f3f4f6',
            bodyColor: '#9ca3af',
            padding: 10,
            cornerRadius: 8
          }
        },
        scales: {
          y: { 
            beginAtZero: true,
            grid: { color: '#e5e7eb' },
            ticks: { stepSize: 1, precision: 0, color: '#6b7280' }
          },
          x: { 
            grid: { display: false },
            ticks: { color: '#6b7280' }
          }
        }
      }
    });
  }

  changePeriod(period: 'week' | 'month'): void {
    this.selectedPeriod = period;
    this.loadChartData();
  }

  // Navigation READ-ONLY - Pas d'actions directes
  goToTransactions(): void {
    this.router.navigate(['/agent/transactions/recus']);
  }

  goToPendingTransactions(): void {
    this.router.navigate(['/agent/transactions/recus']);
  }

  getStatusSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" {
    switch (status) {
      case 'ACCEPTE':
      case 'ACCP':
        return 'success';
      case 'REJETE':
      case 'RJCT':
        return 'danger';
      case 'EN_ATTENTE':
      case 'PDNG':
        return 'warn';
      case 'SIGNALE':
        return 'info';
      default:
        return 'secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ACCEPTE': return 'Accepté';
      case 'ACCP': return 'Accepté';
      case 'REJETE': return 'Rejeté';
      case 'RJCT': return 'Rejeté';
      case 'EN_ATTENTE': return 'En attente';
      case 'PDNG': return 'En attente';
      case 'SIGNALE': return 'Signalé';
      default: return status;
    }
  }
}