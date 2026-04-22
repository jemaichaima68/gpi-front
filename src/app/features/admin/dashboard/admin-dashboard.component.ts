import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService, DashboardStats, AppUser } from '../../../core/services/user.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  stats: DashboardStats | null = null;
  loading = true;
  today = new Date();
  private chart: Chart | null = null;

  private avatarGradients = [
    'linear-gradient(135deg, #8b5cf6, #6366f1)',
    'linear-gradient(135deg, #a78bfa, #8b5cf6)',
    'linear-gradient(135deg, #c4b5fd, #a78bfa)',
    'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
    'linear-gradient(135deg, #f1f5f9, #e2e8f0)'
  ];

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadStats();
  }

  ngAfterViewInit() {
    this.safeBuildChart();
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private safeBuildChart() {
    if (!this.chartCanvas?.nativeElement) return;
    if (!this.stats?.registrationsByMonth || Object.keys(this.stats.registrationsByMonth).length === 0) return;
    setTimeout(() => this.buildChart(), 50);
  }

  loadStats() {
    this.loading = true;
    this.userService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        this.cdr.detectChanges();
        this.safeBuildChart();
      },
      error: (err) => {
        console.error('Error loading stats:', err);
        this.loading = false;
        // Données mockées
        this.stats = {
          totalUsers: 4,
          activeUsers: 3,
          inactiveUsers: 1,
          addedThisMonth: 4,
          byRole: { CLIENT: 2, BACK_OFFICE: 1, Admin: 1 },
          recentUsers: [
            { id: '1', keycloakId: 'kc-1', firstName: 'Admin', lastName: 'Principal', username: 'admin', email: 'admin@gpi.com', role: 'Admin', actif: 1, dateCreation: new Date().toISOString(), dateModification: new Date().toISOString() },
            { id: '2', keycloakId: 'kc-2', firstName: 'CLI', lastName: 'cliente', username: 'cliente', email: 'cli@example.com', role: 'CLIENT', actif: 1, dateCreation: new Date().toISOString(), dateModification: new Date().toISOString() },
            { id: '3', keycloakId: 'kc-3', firstName: 'boshra', lastName: 'jemai', username: 'boshra', email: 'boshra@example.com', role: 'CLIENT', actif: 1, dateCreation: new Date().toISOString(), dateModification: new Date().toISOString() },
            { id: '4', keycloakId: 'kc-4', firstName: 'shaima', lastName: 'jemai', username: 'shaima', email: 'shaima@example.com', role: 'BACK_OFFICE', actif: 0, dateCreation: new Date().toISOString(), dateModification: new Date().toISOString() }
          ] as AppUser[],
          registrationsByMonth: {
            'nov.': 1, 'déc.': 2, 'janv.': 3, 'févr.': 2, 'mars': 4, 'avr.': 3
          }
        };
        this.cdr.detectChanges();
        this.safeBuildChart();
      }
    });
  }

  buildChart() {
    if (!this.chartCanvas?.nativeElement) return;
    if (!this.stats?.registrationsByMonth) return;

    const labels = Object.keys(this.stats.registrationsByMonth);
    const data = Object.values(this.stats.registrationsByMonth);
    if (labels.length === 0 || data.length === 0) return;

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Inscriptions',
          data: data,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.05)',
          borderWidth: 2.5,
          pointBackgroundColor: '#a855f7',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#fff',
            titleColor: '#1e293b',
            bodyColor: '#475569',
            borderColor: '#e2e8f0',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8', font: { size: 11 } }
          },
          y: {
            grid: { color: '#eef2ff' },
            ticks: { color: '#94a3b8', stepSize: 1, precision: 0 },
            beginAtZero: true
          }
        }
      }
    });
  }

  getRoleCount(role: string): number { return this.stats?.byRole?.[role] ?? 0; }
  getActivePercent(): number {
    if (!this.stats || this.stats.totalUsers === 0) return 0;
    return Math.round((this.stats.activeUsers / this.stats.totalUsers) * 100);
  }
  getRoleBarWidth(role: string): number {
    if (!this.stats || this.stats.totalUsers === 0) return 0;
    return Math.round((this.getRoleCount(role) / this.stats.totalUsers) * 100);
  }
  getInitials(user: any): string {
    const first = user.firstName?.charAt(0) ?? '';
    const last = user.lastName?.charAt(0) ?? '';
    const initials = (first + last).toUpperCase();
    return initials.length ? initials : (user.username?.charAt(0).toUpperCase() ?? '?');
  }
  getAvatarGradient(index: number): string { return this.avatarGradients[index % this.avatarGradients.length]; }
  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'ADMIN': case 'Admin': return 'badge-admin';
      case 'BACK_OFFICE': case 'BackOffice': return 'badge-backoffice';
      case 'CLIENT': case 'Client': return 'badge-client';
      default: return 'badge-default';
    }
  }
  getRoleLabel(role: string): string {
    switch (role) {
      case 'ADMIN': case 'Admin': return 'Admin';
      case 'BACK_OFFICE': case 'BackOffice': return 'Back-office';
      case 'CLIENT': case 'Client': return 'Client';
      default: return role;
    }
  }
}