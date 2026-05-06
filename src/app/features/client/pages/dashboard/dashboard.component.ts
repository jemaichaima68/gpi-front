import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TransferService, ClientDashboardDto } from '../../services/transfer.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userName = '';
  isLoading = true;
  errorMessage = '';
  
  dashboard: ClientDashboardDto = {
    totalTransactions: 0,
    pendingTransactions: 0,
    acceptedTransactions: 0,
    rejectedTransactions: 0,
    totalAmount: 0,
    averageProcessingTimeHours: 0,
    recentTransactions: [],
    statusDistribution: {}
  };
  
  timelineTransactions: any[] = [];

  constructor(
    private service: TransferService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.service.getDashboard().subscribe({
      next: (res) => {
        console.log('✅ Dashboard du backend:', res);
        this.dashboard = res;
        this.timelineTransactions = (res.recentTransactions || []).map(t => ({
          ...t,
          statusText: this.getStatusLabel(t.status),
          statusClass: this.getStatusClass(t.status),
          dateFormatted: this.formatDate(t.receivedAt),
          timeAgo: this.getTimeAgo(t.receivedAt),
          beneficiaryName: t.creditorName || t.debtorName || 'Client'
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Erreur backend:', err);
        this.errorMessage = 'Impossible de charger vos données. Vérifiez que le backend est démarré.';
        this.isLoading = false;
      }
    });
  }

  loadProfile() {
    try {
      const fullName = this.authService.getFullName();
      if (fullName && fullName !== ' ') {
        this.userName = fullName.split(' ')[0];
      } else {
        this.userName = this.authService.getUsername() || 'Client';
      }
    } catch (e) {
      this.userName = 'Client';
    }
  }

  getTimeAgo(date: string): string {
    if (!date) return '';
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    return `Il y a ${diffDays} jours`;
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = { 
      'PDNG': 'En attente', 
      'ACSC': 'Finalisé', 
      'ACTC': 'Validation technique',
      'ACSP': 'En traitement',
      'RJCT': 'Rejeté'
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'PDNG': 'pending',
      'ACSC': 'completed',
      'ACTC': 'pending',
      'ACSP': 'pending',
      'RJCT': 'rejected'
    };
    return map[status] || 'pending';
  }

  goToTracking(uetr: string) {
    if (uetr) {
      this.router.navigate(['/client/tracking'], { queryParams: { uetr } });
    }
  }

  viewTransferDetails(item: any) {
    if (item?.uetr) {
      this.router.navigate(['/client/tracking'], { queryParams: { uetr: item.uetr } });
    }
  }

  retryLoad() {
    this.loadData();
  }
}