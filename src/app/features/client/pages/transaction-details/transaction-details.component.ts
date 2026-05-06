import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { TransferService } from '../../services/transfer.service';
import { TransferResponse } from '../../services/transfer.service';

@Component({
  selector: 'app-transaction-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="detail-container">
      <div class="header">
        <h2>📋 Détail de la transaction</h2>
        <div class="header-buttons">
          <button class="btn-back" routerLink="/client/history">
            ← Retour à l'historique
          </button>
        </div>
      </div>

      <div class="detail-card">
        <!-- Error -->
        <div *ngIf="errorMessage" class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Erreur</h3>
          <p>{{ errorMessage }}</p>
          <button class="btn-retry" (click)="reload()">Réessayer</button>
        </div>

        <!-- Transaction Details -->
        <div *ngIf="transaction" class="detail-content">
          
          <!-- Alert Banner -->
          <div *ngIf="transaction.alerte && transaction.alerte !== 'OK'" 
               class="alert-banner" 
               [class.alert-grave]="transaction.alerte === 'GRAVE'"
               [class.alert-attention]="transaction.alerte === 'ATTENTION'">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <strong>{{ getAlerteLabel(transaction.alerte) }}</strong>
              <span *ngIf="transaction.motifAlerte">{{ transaction.motifAlerte }}</span>
            </div>
          </div>

          <div class="detail-grid">
            <div class="detail-row">
              <div class="detail-label">UETR :</div>
              <div class="detail-value uetr-value">
                <code>{{ transaction.uetr || '-' }}</code>
                <button *ngIf="transaction.uetr" class="copy-btn" (click)="copyToClipboard(transaction.uetr)">📋</button>
              </div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Montant :</div>
              <div class="detail-value amount">
                <strong>{{ transaction.amount | number:'1.2-2' }} {{ transaction.currency || 'EUR' }}</strong>
              </div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Donneur d'ordre :</div>
              <div class="detail-value">{{ transaction.senderName || transaction.debtorName || '-' }}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Bénéficiaire :</div>
              <div class="detail-value">{{ transaction.beneficiaryName || transaction.creditorName || '-' }}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Banque bénéficiaire :</div>
              <div class="detail-value">{{ transaction.beneficiaryBank || transaction.creditorAgentBic || '-' }}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Statut :</div>
              <div class="detail-value">
                <span class="status-badge" [class]="transaction.status">
                  {{ getStatusLabel(transaction.status) }}
                </span>
              </div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Date de création :</div>
              <div class="detail-value">{{ formatDateTime(transaction.createdAt) }}</div>
            </div>
            
            <div class="detail-row" *ngIf="transaction.rejectionReason">
              <div class="detail-label">Motif rejet :</div>
              <div class="detail-value rejection-reason">{{ transaction.rejectionReason }}</div>
            </div>
          </div>

          <!-- Parcours bancaire -->
          <div class="journey-section" *ngIf="transaction.bankJourney && transaction.bankJourney.length > 0">
            <h3>🌍 Parcours du virement SWIFT GPI</h3>
            <div class="journey-list">
              <div *ngFor="let bank of transaction.bankJourney; let i = index" class="journey-item">
                <div class="journey-number">{{ bank.step || (i+1) }}</div>
                <div class="journey-content">
                  <div class="journey-bank">{{ bank.bankName }}</div>
                  <div class="journey-role">{{ bank.role }}</div>
                  <div class="journey-fees" *ngIf="bank.fees">{{ bank.fees }}</div>
                </div>
                <div class="journey-status">
                  <span class="status-badge" [class]="getStatusClass(bank.status)">
                    {{ bank.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Résumé des frais -->
          <div class="fees-card" *ngIf="transaction.totalFees">
            <h3>💰 Résumé des frais déduits</h3>
            <div class="fees-grid">
              <div class="fees-item">
                <span class="fees-label">Frais totaux :</span>
                <span class="fees-amount">{{ transaction.totalFees | number:'1.2-2' }} EUR</span>
              </div>
              <div class="fees-item highlight">
                <span class="fees-label">Montant net crédité :</span>
                <span class="fees-amount">{{ transaction.netAmount | number:'1.2-2' }} USD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .detail-container { padding: 24px; max-width: 900px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .header h2 { margin: 0; font-size: 1.5rem; font-weight: 700; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .btn-back { padding: 8px 20px; background: white; border: 1px solid #e2e8f0; border-radius: 40px; font-weight: 600; font-size: 13px; color: #667eea; cursor: pointer; }
    .detail-card { background: white; border-radius: 24px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .error-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; }
    .error-icon { font-size: 48px; margin-bottom: 16px; }
    .error-state h3 { margin: 0 0 8px 0; color: #dc2626; }
    .btn-retry { padding: 10px 24px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 40px; font-weight: 600; cursor: pointer; }
    .alert-banner { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-radius: 14px; margin-bottom: 24px; }
    .alert-banner.alert-grave { background: #fee2e2; border-left: 4px solid #dc2626; }
    .alert-banner.alert-attention { background: #fef3c7; border-left: 4px solid #f59e0b; }
    .detail-grid { display: flex; flex-direction: column; gap: 0; }
    .detail-row { display: flex; padding: 14px 0; border-bottom: 1px solid #f1f5f9; }
    .detail-label { width: 160px; font-weight: 700; color: #1e293b; flex-shrink: 0; }
    .detail-value { flex: 1; color: #475569; word-break: break-word; }
    .uetr-value { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .copy-btn { background: none; border: none; cursor: pointer; font-size: 14px; }
    .amount strong { color: #667eea; }
    .status-badge { display: inline-block; padding: 5px 14px; border-radius: 30px; font-size: 12px; font-weight: 700; }
    .status-badge.PDNG, .status-badge.EN_ATTENTE { background: #fef3c7; color: #d97706; }
    .status-badge.ACSC, .status-badge.ACCEPTE { background: #d1fae5; color: #059669; }
    .status-badge.RJCT, .status-badge.REJETE { background: #fee2e2; color: #dc2626; }
    .rejection-reason { color: #dc2626; font-style: italic; }
    .journey-section { margin-top: 24px; padding-top: 24px; border-top: 1px solid #f1f5f9; }
    .journey-section h3 { font-size: 16px; margin-bottom: 16px; color: #1e293b; }
    .journey-list { display: flex; flex-direction: column; gap: 12px; }
    .journey-item { display: flex; align-items: center; gap: 16px; padding: 12px; background: #f8fafc; border-radius: 14px; }
    .journey-number { width: 32px; height: 32px; background: #667eea; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
    .journey-content { flex: 1; }
    .journey-bank { font-weight: 700; color: #1e293b; margin-bottom: 4px; }
    .journey-role { font-size: 12px; color: #64748b; }
    .journey-fees { font-size: 11px; color: #94a3b8; }
    .fees-card { margin-top: 24px; padding: 20px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; color: white; }
    .fees-card h3 { font-size: 14px; margin-bottom: 16px; opacity: 0.8; }
    .fees-grid { display: flex; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
    .fees-item { flex: 1; }
    .fees-label { display: block; font-size: 11px; opacity: 0.7; margin-bottom: 6px; }
    .fees-amount { font-size: 18px; font-weight: 700; }
    .fees-item.highlight .fees-amount { font-size: 22px; color: #fbbf24; }
    @media (max-width: 640px) {
      .detail-container { padding: 16px; }
      .detail-row { flex-direction: column; gap: 6px; }
      .detail-label { width: 100%; }
      .journey-item { flex-direction: column; text-align: center; }
    }
  `]
})
export class TransactionDetailsComponent implements OnInit {
  transaction: TransferResponse | null = null;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private service: TransferService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('🚀 TransactionDetailsComponent initialized');
    const id = this.route.snapshot.paramMap.get('id');
    const uetr = this.route.snapshot.paramMap.get('uetr');
    console.log('📌 ID reçu:', id, 'UETR reçu:', uetr);
    
    if (id) {
      this.loadTransactionById(+id);
    } else if (uetr) {
      this.loadTransactionByUetr(uetr);
    } else {
      this.errorMessage = 'Aucun identifiant de transaction fourni';
    }
  }

  loadTransactionById(id: number) {
    this.service.getTransactionDetails(id).subscribe({
      next: (res) => {
        console.log('✅ Transaction chargée par ID:', res);
        this.transaction = res;
      },
      error: (err) => {
        console.error('❌ Erreur chargement par ID:', err);
        this.errorMessage = 'Transaction non trouvée';
      }
    });
  }

  loadTransactionByUetr(uetr: string) {
    this.service.getTransferByUetr(uetr).subscribe({
      next: (res) => {
        console.log('✅ Transaction chargée par UETR:', res);
        this.transaction = res;
      },
      error: (err) => {
        console.error('❌ Erreur chargement par UETR:', err);
        this.errorMessage = 'Transaction non trouvée';
      }
    });
  }

  reload() {
    this.errorMessage = '';
    const id = this.route.snapshot.paramMap.get('id');
    const uetr = this.route.snapshot.paramMap.get('uetr');
    if (id) {
      this.loadTransactionById(+id);
    } else if (uetr) {
      this.loadTransactionByUetr(uetr);
    }
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'PDNG': 'En attente',
      'EN_ATTENTE': 'En attente',
      'ACSC': 'Finalisé',
      'ACCEPTE': 'Finalisé',
      'ACTC': 'Validation technique',
      'ACSP': 'En traitement',
      'RJCT': 'Rejeté',
      'REJETE': 'Rejeté'
    };
    return map[status] || status || 'Inconnu';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Envoyé': 'status-sent',
      'En cours': 'status-pending',
      'Traitement': 'status-pending',
      'Terminé': 'status-completed',
      'Rejeté': 'status-rejected'
    };
    return map[status] || 'status-pending';
  }

  getAlerteLabel(alerte: string): string {
    switch (alerte) {
      case 'OK': return '✓ Transaction conforme';
      case 'ATTENTION': return '⚠️ Alerte - À vérifier';
      case 'GRAVE': return '🔴 Alerte critique';
      default: return alerte;
    }
  }

  formatDateTime(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert('UETR copié dans le presse-papier');
  }
}