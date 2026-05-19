import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TransferService, ClientDashboardDto, RecentTransactionDto } from '../../services/transfer.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  userName = '';
  isLoading = true;
  uetrToSearch = '';
  private refreshInterval: any;
  
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

  activeTransfer: RecentTransactionDto | null = null;

  // Mapping des pays (garde tel quel)
  private readonly countryMapping: Record<string, { city: string; flag: string; name: string }> = {
    'FR': { city: 'Paris', flag: '🇫🇷', name: 'France' },
    'US': { city: 'New York', flag: '🇺🇸', name: 'États-Unis' },
    'GB': { city: 'Londres', flag: '🇬🇧', name: 'Royaume-Uni' },
    'DE': { city: 'Berlin', flag: '🇩🇪', name: 'Allemagne' },
    'IT': { city: 'Rome', flag: '🇮🇹', name: 'Italie' },
    'ES': { city: 'Madrid', flag: '🇪🇸', name: 'Espagne' },
    'CH': { city: 'Zurich', flag: '🇨🇭', name: 'Suisse' },
    'BE': { city: 'Bruxelles', flag: '🇧🇪', name: 'Belgique' },
    'LU': { city: 'Luxembourg', flag: '🇱🇺', name: 'Luxembourg' },
    'NL': { city: 'Amsterdam', flag: '🇳🇱', name: 'Pays-Bas' },
    'PT': { city: 'Lisbonne', flag: '🇵🇹', name: 'Portugal' },
    'CA': { city: 'Toronto', flag: '🇨🇦', name: 'Canada' },
    'AE': { city: 'Dubaï', flag: '🇦🇪', name: 'Émirats Arabes Unis' },
    'CN': { city: 'Shanghai', flag: '🇨🇳', name: 'Chine' },
    'JP': { city: 'Tokyo', flag: '🇯🇵', name: 'Japon' },
    'SG': { city: 'Singapour', flag: '🇸🇬', name: 'Singapour' },
    'AU': { city: 'Sydney', flag: '🇦🇺', name: 'Australie' },
    'MA': { city: 'Casablanca', flag: '🇲🇦', name: 'Maroc' },
    'TN': { city: 'Tunis', flag: '🇹🇳', name: 'Tunisie' },
    'DZ': { city: 'Alger', flag: '🇩🇿', name: 'Algérie' },
    'SN': { city: 'Dakar', flag: '🇸🇳', name: 'Sénégal' },
    'CI': { city: 'Abidjan', flag: '🇨🇮', name: 'Côte d\'Ivoire' },
    'CM': { city: 'Douala', flag: '🇨🇲', name: 'Cameroun' },
    'ML': { city: 'Bamako', flag: '🇲🇱', name: 'Mali' },
    'NE': { city: 'Niamey', flag: '🇳🇪', name: 'Niger' },
    'BF': { city: 'Ouagadougou', flag: '🇧🇫', name: 'Burkina Faso' },
    'TG': { city: 'Lomé', flag: '🇹🇬', name: 'Togo' },
    'BJ': { city: 'Cotonou', flag: '🇧🇯', name: 'Bénin' }
  };

  private readonly statusPosition: Record<string, number> = {
    'EN_ATTENTE': 1,
    'PDNG': 1,
    'ACCEPTE': 4,
    'ACSC': 4,
    'REJETE': 0
  };

  constructor(
    private service: TransferService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadData();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.refreshData();
    }, 10000);
  }

  refreshData() {
    this.service.getDashboard().subscribe({
      next: (res) => {
        this.activeTransfer = res.recentTransactions[0] || null;
        this.dashboard = {
          totalTransactions: res.totalTransactions || 0,
          pendingTransactions: res.pendingTransactions || 0,
          acceptedTransactions: res.acceptedTransactions || 0,
          rejectedTransactions: res.rejectedTransactions || 0,
          totalAmount: res.totalAmount || 0,
          averageProcessingTimeHours: res.averageProcessingTimeHours || 0,
          recentTransactions: res.recentTransactions || [],
          statusDistribution: res.statusDistribution || {}
        };
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur rafraîchissement:', err);
      }
    });
  }

  loadData() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.service.getDashboard().subscribe({
      next: (res) => {
        console.log('📊 Données dashboard reçues:', res);
        
        this.dashboard = {
          totalTransactions: res.totalTransactions || 0,
          pendingTransactions: res.pendingTransactions || 0,
          acceptedTransactions: res.acceptedTransactions || 0,
          rejectedTransactions: res.rejectedTransactions || 0,
          totalAmount: res.totalAmount || 0,
          averageProcessingTimeHours: res.averageProcessingTimeHours || 0,
          recentTransactions: res.recentTransactions || [],
          statusDistribution: res.statusDistribution || {}
        };
        
        this.activeTransfer = this.dashboard.recentTransactions[0] || null;
        
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur dashboard:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadProfile() {
    try {
      const fullName = this.authService.getFullName();
      this.userName = fullName && fullName.trim() !== '' 
        ? fullName.split(' ')[0] 
        : (this.authService.getUsername() || 'Client');
    } catch (e) {
      this.userName = 'Client';
    }
    this.cdr.detectChanges();
  }

  // ==================== MÉTHODES POUR LA CARTE GPS ====================
  
  getSenderCountry(transaction: RecentTransactionDto | null): string {
    if (!transaction) return 'FR';
    const country = transaction.debtorCountry;
    if (country && country !== '??' && country.length === 2) {
      return country;
    }
    return 'FR';
  }

  getReceiverCountry(transaction: RecentTransactionDto | null): string {
    if (!transaction) return 'FR';
    const country = transaction.creditorCountry;
    if (country && country !== '??' && country.length === 2) {
      return country;
    }
    return 'FR';
  }

  getSenderCity(transaction: RecentTransactionDto | null): string {
    const country = this.getSenderCountry(transaction);
    const mapping = this.countryMapping[country];
    return mapping?.city || this.getSenderCountryName(transaction);
  }

  getReceiverCity(transaction: RecentTransactionDto | null): string {
    const country = this.getReceiverCountry(transaction);
    const mapping = this.countryMapping[country];
    return mapping?.city || this.getReceiverCountryName(transaction);
  }

  getSenderFlag(transaction: RecentTransactionDto | null): string {
    const country = this.getSenderCountry(transaction);
    const mapping = this.countryMapping[country];
    return mapping?.flag || '🏦';
  }

  getReceiverFlag(transaction: RecentTransactionDto | null): string {
    const country = this.getReceiverCountry(transaction);
    const mapping = this.countryMapping[country];
    return mapping?.flag || '🏦';
  }

  getSenderCountryName(transaction: RecentTransactionDto | null): string {
    const country = this.getSenderCountry(transaction);
    const mapping = this.countryMapping[country];
    return mapping?.name || 'Banque émettrice';
  }

  getReceiverCountryName(transaction: RecentTransactionDto | null): string {
    const country = this.getReceiverCountry(transaction);
    const mapping = this.countryMapping[country];
    return mapping?.name || 'Banque bénéficiaire';
  }

  getFlagFromCountry(countryCode: string): string {
    return this.countryMapping[countryCode]?.flag || '🏦';
  }

  getPointPosition(status?: string): string {
    if (!status) return 'position-1';
    const position = this.statusPosition[status] ?? 1;
    return `position-${position}`;
  }

  getPositionClass(status?: string): string {
    if (!status) return 'pending';
    if (status === 'ACCEPTE' || status === 'ACSC') return 'success';
    if (status === 'REJETE') return 'danger';
    return 'pending';
  }

  isStepCompleted(step: string): boolean {
    if (!this.activeTransfer) return false;
    const status = this.activeTransfer.status;
    const agentValidated = this.activeTransfer.agentValidated;
    
    if (step === 'VALIDATION') {
      return agentValidated === true;
    }
    if (step === 'BENEF') {
      return status === 'ACCEPTE' || status === 'ACSC';
    }
    return false;
  }

  // ==================== MÉTHODES SIMPLIFIÉES ====================
  
  getStatusLabel(status: string, agentValidated?: boolean): string {
    if (status === 'REJETE') {
      return 'Rejetée';
    }
    if (status === 'ACCEPTE' || status === 'ACSC') {
      return ' Acceptée';
    }
    if (agentValidated === true && (status === 'EN_ATTENTE' || status === 'PDNG')) {
      return ' En attente de validation';
    }
    return ' En attente';
  }

  getStatusClass(status: string): string {
    if (status === 'ACCEPTE' || status === 'ACSC') return 'success';
    if (status === 'REJETE') return 'danger';
    return 'pending';
  }

  getProgressPercentage(status?: string, agentValidated?: boolean): number {
    if (!status) return 0;
    
    if (status === 'REJETE') return 0;
    if (status === 'ACCEPTE' || status === 'ACSC') return 100;
    if (agentValidated === true && (status === 'EN_ATTENTE' || status === 'PDNG')) {
      return 50;
    }
    return 10;
  }

  getTimelineWidth(): string {
    if (!this.activeTransfer) return '0%';
    return `${this.getProgressPercentage(this.activeTransfer.status, this.activeTransfer.agentValidated)}%`;
  }

  getRejectionReason(transfer: RecentTransactionDto): string {
    return (transfer as any).rejectionReason || 'Non spécifié';
  }

  // ==================== NAVIGATION ====================
  
  // ⭐ MODIFIÉ : Redirige directement vers tracking avec l'UETR
  goToDetails(transfer: RecentTransactionDto) {
    if (transfer.uetr) {
      this.router.navigate(['/client/tracking'], { queryParams: { uetr: transfer.uetr } });
    } else {
      this.router.navigate(['/client/tracking']);
    }
  }

  goToTracking(uetr?: string) {
    const searchUetr = uetr || this.uetrToSearch;
    if (searchUetr && searchUetr.trim()) {
      this.router.navigate(['/client/tracking'], { queryParams: { uetr: searchUetr } });
    } else {
      this.router.navigate(['/client/tracking']);
    }
  }
}