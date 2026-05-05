import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { TransferService } from '../../services/transfer.service';

@Component({
  selector: 'app-transaction-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
        
        <!-- Loading -->
        <div *ngIf="isLoading" class="empty-state">
          <div class="spinner"></div>
          <p>Chargement en cours...</p>
        </div>

        <!-- Error -->
        <div *ngIf="errorMessage && !isLoading" class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Erreur</h3>
          <p>{{ errorMessage }}</p>
          <button class="btn-retry" (click)="reload()">Réessayer</button>
        </div>

        <!-- Transaction Details -->
        <div *ngIf="transaction && !isLoading" class="detail-content">
          
          <!-- Alert Banner si alerte -->
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
              <div class="detail-label">MsgId :</div>
              <div class="detail-value"><code>{{ transaction.msgId || '-' }}</code></div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Type :</div>
              <div class="detail-value">
                <span class="type-badge">{{ transaction.messageType || 'PACS008' }}</span>
              </div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">UETR :</div>
              <div class="detail-value uetr-value">
                <code>{{ transaction.uetr || '-' }}</code>
                <button *ngIf="transaction.uetr" class="copy-btn" (click)="copyToClipboard(transaction.uetr)">
                  📋
                </button>
              </div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Montant :</div>
              <div class="detail-value amount">
                <strong>{{ transaction.amount | number:'1.2-2' }} {{ transaction.currency || 'EUR' }}</strong>
              </div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Débiteur :</div>
              <div class="detail-value">{{ transaction.debtorName || transaction.senderName || '-' }}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Créditeur :</div>
              <div class="detail-value">{{ transaction.creditorName || transaction.beneficiaryName || '-' }}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Pays bénéficiaire :</div>
              <div class="detail-value">
                <span class="country-badge">{{ transaction.creditorCountry || transaction.beneficiaryCountry || '-' }}</span>
              </div>
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
              <div class="detail-label">Reçu le :</div>
              <div class="detail-value">{{ formatDateTime(transaction.receivedAt || transaction.createdAt) }}</div>
            </div>
            
            <div class="detail-row" *ngIf="transaction.fileName">
              <div class="detail-label">Fichier source :</div>
              <div class="detail-value mono">{{ transaction.fileName }}</div>
            </div>
            
            <div class="detail-row" *ngIf="transaction.rejectionReason">
              <div class="detail-label">Motif rejet :</div>
              <div class="detail-value rejection-reason">{{ transaction.rejectionReason }}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .detail-container {
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
      font-family: 'Inter', 'Segoe UI', sans-serif;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header-buttons {
      display: flex;
      gap: 12px;
    }

    .btn-back {
      padding: 8px 20px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 40px;
      font-weight: 600;
      font-size: 13px;
      color: #667eea;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-back:hover {
      background: #f8fafc;
      transform: translateY(-1px);
    }

    .detail-card {
      background: white;
      border-radius: 24px;
      padding: 24px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }

    .empty-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }

    .spinner {
      width: 44px;
      height: 44px;
      border: 3px solid #e2e8f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .error-state h3 {
      margin: 0 0 8px 0;
      color: #dc2626;
    }

    .error-state p {
      color: #64748b;
      margin-bottom: 20px;
    }

    .btn-retry {
      padding: 10px 24px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 40px;
      font-weight: 600;
      cursor: pointer;
    }

    .alert-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-radius: 14px;
      margin-bottom: 24px;
    }

    .alert-banner.alert-grave {
      background: #fee2e2;
      border-left: 4px solid #dc2626;
    }

    .alert-banner.alert-attention {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
    }

    .alert-icon {
      font-size: 20px;
    }

    .alert-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .alert-content strong {
      font-weight: 800;
      font-size: 0.85rem;
    }

    .alert-content span {
      font-size: 0.8rem;
      color: #374151;
    }

    .detail-grid {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .detail-row {
      display: flex;
      padding: 14px 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-label {
      width: 160px;
      font-weight: 700;
      color: #1e293b;
      flex-shrink: 0;
    }

    .detail-value {
      flex: 1;
      color: #475569;
      word-break: break-word;
    }

    .detail-value code {
      background: #f1f5f9;
      padding: 4px 8px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-family: monospace;
    }

    .type-badge {
      background: rgba(102,126,234,0.1);
      color: #667eea;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .uetr-value {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .copy-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      padding: 0 4px;
    }

    .copy-btn:hover {
      transform: scale(1.1);
    }

    .amount {
      font-size: 1.1rem;
    }

    .amount strong {
      color: #667eea;
    }

    .country-badge {
      background: rgba(16,185,129,0.1);
      color: #059669;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-badge {
      display: inline-block;
      padding: 5px 14px;
      border-radius: 30px;
      font-size: 12px;
      font-weight: 700;
    }

    .status-badge.PDNG, .status-badge.EN_ATTENTE { background: #fef3c7; color: #d97706; }
    .status-badge.ACSC, .status-badge.ACCEPTE { background: #d1fae5; color: #059669; }
    .status-badge.ACTC { background: #dbeafe; color: #2563eb; }
    .status-badge.ACSP { background: #fef3c7; color: #d97706; }
    .status-badge.RJCT, .status-badge.REJETE { background: #fee2e2; color: #dc2626; }

    .rejection-reason {
      color: #dc2626;
      font-style: italic;
    }

    .mono {
      font-family: monospace;
      font-size: 12px;
    }

    @media (max-width: 640px) {
      .detail-container {
        padding: 16px;
      }
      
      .detail-row {
        flex-direction: column;
        gap: 6px;
      }
      
      .detail-label {
        width: 100%;
      }
      
      .header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .header-buttons {
        width: 100%;
      }
      
      .btn-back {
        width: 100%;
        text-align: center;
      }
    }
  `]
})
export class TransactionDetailsComponent implements OnInit {
  transaction: any = null;
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private service: TransferService,
    private router: Router
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const uetr = this.route.snapshot.paramMap.get('uetr');
    
    if (id) {
      this.loadTransactionById(+id);
    } else if (uetr) {
      this.loadTransactionByUetr(uetr);
    } else {
      this.errorMessage = 'Aucun identifiant de transaction fourni';
      this.isLoading = false;
    }
  }

  loadTransactionById(id: number) {
    this.isLoading = true;
    this.service.getTransactionDetails(id).subscribe({
      next: (res) => {
        this.transaction = res;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Transaction non trouvée';
        this.isLoading = false;
      }
    });
  }

  loadTransactionByUetr(uetr: string) {
    this.isLoading = true;
    this.service.getTransferByUetr(uetr).subscribe({
      next: (res) => {
        this.transaction = res;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Transaction non trouvée';
        this.isLoading = false;
      }
    });
  }

  reload() {
    this.isLoading = true;
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
      'PDNG': 'PDNG (En attente)',
      'EN_ATTENTE': 'PDNG (En attente)',
      'ACSC': 'ACCP (Accepté)',
      'ACCEPTE': 'ACCP (Accepté)',
      'ACTC': 'ACTC (Validé techniquement)',
      'ACSP': 'ACSP (En traitement)',
      'RJCT': 'RJCT (Rejeté)',
      'REJETE': 'RJCT (Rejeté)'
    };
    return map[status] || status || 'Inconnu';
  }

  formatDateTime(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getAlerteLabel(alerte: string): string {
    switch (alerte) {
      case 'OK': return '✓ Transaction conforme';
      case 'ATTENTION': return '⚠️ Alerte - À vérifier';
      case 'GRAVE': return '🔴 Alerte critique';
      default: return alerte;
    }
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert('UETR copié dans le presse-papier');
  }
}