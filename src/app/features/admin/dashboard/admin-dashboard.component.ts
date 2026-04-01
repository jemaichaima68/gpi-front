import { Component, OnInit, AfterViewInit,
         ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService, DashboardStats } from '../../../core/services/user.service';
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

  private chartCanvas!: ElementRef;

  @ViewChild('chartCanvas') set setChartCanvas(el: ElementRef) {
    if (el) {
      this.chartCanvas = el;
      this.buildChart();
    }
  }

  stats: DashboardStats | null = null;
  loading = true;
  today = new Date();
  private chart: Chart | null = null;

  private avatarGradients = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #10b981, #34d399)',
    'linear-gradient(135deg, #f59e0b, #fbbf24)',
    'linear-gradient(135deg, #ef4444, #f97316)',
    'linear-gradient(135deg, #8b5cf6, #a855f7)',
    'linear-gradient(135deg, #ec489a, #f472b6)',
    'linear-gradient(135deg, #06b6d4, #3b82f6)',
    'linear-gradient(135deg, #84cc16, #22c55e)'
  ];

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loading = true;
    this.userService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        setTimeout(() => this.buildChart(), 100);
      },
      error: (err) => { 
        console.error('Error loading stats:', err);
        this.loading = false; 
      }
    });
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  buildChart() {
    if (!this.stats?.registrationsByMonth) return;
    if (!this.chartCanvas?.nativeElement) return;

    const labels = Object.keys(this.stats.registrationsByMonth);
    const data = Object.values(this.stats.registrationsByMonth);

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Inscriptions',
          data,
          backgroundColor: 'rgba(102, 126, 234, 0.15)',
          borderColor: '#667eea',
          borderWidth: 2,
          borderRadius: 12,
          borderSkipped: false,
          barPercentage: 0.65,
          categoryPercentage: 0.8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#ffffff',
            titleColor: '#1e293b',
            bodyColor: '#475569',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 12,
            titleFont: { size: 13, weight: 'bold', family: 'Plus Jakarta Sans' },
            bodyFont: { size: 12, family: 'Plus Jakarta Sans' },
            callbacks: {
              label: (ctx: any) => ` ${ctx.parsed.y} inscription(s)`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { 
              color: '#94a3b8', 
              font: { size: 12, family: 'Plus Jakarta Sans' },
              padding: 8
            }
          },
          y: {
            grid: { color: '#e2e8f0', lineWidth: 1 },
            border: { display: false },
            ticks: {
              color: '#94a3b8',
              font: { size: 12, family: 'Plus Jakarta Sans' },
              stepSize: 1,
              precision: 0,
              padding: 8
            },
            beginAtZero: true
          }
        },
        layout: {
          padding: {
            left: 10,
            right: 10,
            top: 20,
            bottom: 10
          }
        }
      }
    });
  }

  getRoleCount(role: string): number {
    return this.stats?.byRole?.[role] ?? 0;
  }

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
    return initials.length > 0
      ? initials
      : (user.username?.charAt(0).toUpperCase() ?? '?');
  }

  getAvatarGradient(index: number): string {
    return this.avatarGradients[index % this.avatarGradients.length];
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'ADMIN':
      case 'Admin':
        return 'ufi-badge badge-admin';
      case 'BACK_OFFICE':
      case 'BackOffice':
        return 'ufi-badge badge-backoffice';
      case 'CLIENT':
      case 'Client':
        return 'ufi-badge badge-client';
      default:
        return 'ufi-badge badge-default';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'ADMIN':
      case 'Admin':
        return 'Admin';
      case 'BACK_OFFICE':
      case 'BackOffice':
        return 'Back-office';
      case 'CLIENT':
      case 'Client':
        return 'Client';
      default:
        return role;
    }
  }
}