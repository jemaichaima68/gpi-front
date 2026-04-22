import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    CardModule, 
    ToastModule, 
    TagModule, 
    TooltipModule
  ],
  providers: [MessageService],
  template: `
    <div class="detail-container">
      <p-toast />
      
      <div class="header">
        <h2>📋 Détail de la transaction</h2>
        <p-button label="Retour au tableau de bord" icon="pi pi-dashboard" (onClick)="goBackToDashboard()" styleClass="p-button-outlined" />
      </div>

      <p-card>
        <div *ngIf="loading && !transaction && !error" class="empty-state">
          <i class="pi pi-spin pi-spinner"></i>
          <p>Chargement en cours...</p>
        </div>

        <div *ngIf="error" class="error-state">
          <i class="pi pi-exclamation-triangle"></i>
          <h3>Erreur</h3>
          <p>{{ error }}</p>
          <p-button label="Réessayer" icon="pi pi-refresh" (onClick)="loadTransaction()" />
        </div>

        <div *ngIf="transaction && !loading">
          
          <div *ngIf="transaction.alerte && transaction.alerte !== 'OK'" 
               class="alert-banner" 
               [class.alert-grave]="transaction.alerte === 'GRAVE'"
               [class.alert-attention]="transaction.alerte === 'ATTENTION'">
            <i [class]="'pi ' + getAlerteIcon(transaction.alerte)"></i>
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
                <p-tag [value]="transaction.messageType || '-'" severity="info" />
              </div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">UETR :</div>
              <div class="detail-value uetr-value">
                <code>{{ transaction.uetr || '-' }}</code>
                <i *ngIf="transaction.uetr" 
                   class="pi pi-copy" 
                   (click)="copyToClipboard(transaction.uetr)"
                   pTooltip="Copier l'UETR"
                   tooltipPosition="top"></i>
              </div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Montant :</div>
              <div class="detail-value amount">
                <strong>{{ transaction.amount | number:'1.2-2' }} {{ transaction.currency }}</strong>
              </div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Débiteur :</div>
              <div class="detail-value">{{ transaction.debtorName || '-' }}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Créditeur :</div>
              <div class="detail-value">{{ transaction.creditorName || '-' }}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Pays bénéficiaire :</div>
              <div class="detail-value">
                <span class="country-badge">{{ transaction.creditorCountry || '-' }}</span>
              </div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Statut :</div>
              <div class="detail-value">
                <p-tag 
                  [value]="getStatusLabel(transaction.status)" 
                  [severity]="getStatusSeverity(transaction.status)"
                  [pTooltip]="getStatusTooltip(transaction.status)"
                  tooltipPosition="top" />
              </div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Reçu le :</div>
              <div class="detail-value">{{ transaction.receivedAt | date:'dd/MM/yyyy HH:mm:ss' }}</div>
            </div>
            
            <div class="detail-row" *ngIf="transaction.rejectionReason">
              <div class="detail-label">Motif rejet :</div>
              <div class="detail-value rejection-reason">{{ transaction.rejectionReason }}</div>
            </div>
            
            <div class="detail-row" *ngIf="transaction.originalMsgId">
              <div class="detail-label">Message original :</div>
              <div class="detail-value">{{ transaction.originalMsgId }}</div>
            </div>
          </div>

          <div class="action-buttons" *ngIf="needsAgentAction(transaction.status)">
            <p-button 
              label="Accepter" 
              icon="pi pi-check" 
              severity="success" 
              (onClick)="acceptTransaction()" />
            <p-button 
              label="Rejeter" 
              icon="pi pi-times" 
              severity="danger" 
              (onClick)="rejectTransaction()" />
          </div>
        </div>
      </p-card>
    </div>
  `,
  styles: [`
    .detail-container {
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
      font-family: 'Plus Jakarta Sans', sans-serif;
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
      background: linear-gradient(135deg, #4f46e5, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .empty-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }

    .empty-state i, .error-state i {
      font-size: 2rem;
      color: #4f46e5;
      margin-bottom: 16px;
    }

    .error-state i {
      color: #ef4444;
    }

    .alert-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-radius: 14px;
      margin-bottom: 24px;
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
    }

    .alert-banner.alert-grave {
      background: #fee2e2;
      border-left-color: #ef4444;
    }

    .alert-banner.alert-attention {
      background: #fef3c7;
      border-left-color: #f59e0b;
    }

    .alert-banner i {
      font-size: 1.2rem;
    }

    .alert-grave i { color: #ef4444; }
    .alert-attention i { color: #f59e0b; }

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
      border-bottom: 1px solid #e2e8f0;
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

    .uetr-value {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .uetr-value .pi-copy {
      cursor: pointer;
      color: #4f46e5;
      font-size: 0.8rem;
      transition: all 0.2s;
    }

    .uetr-value .pi-copy:hover {
      transform: scale(1.1);
      color: #7c3aed;
    }

    .amount {
      font-size: 1.1rem;
    }

    .country-badge {
      background: rgba(79, 70, 229, 0.1);
      color: #4f46e5;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .rejection-reason {
      color: #dc2626;
      font-style: italic;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }

    :host ::ng-deep .p-card {
      background: rgba(255,255,255,0.9);
      backdrop-filter: blur(16px);
      border-radius: 22px;
      border: 1px solid rgba(199,210,254,0.5);
      box-shadow: 0 4px 24px rgba(79,70,229,0.06);
    }

    :host ::ng-deep .p-card .p-card-body {
      padding: 24px;
    }

    @media (max-width: 640px) {
      .detail-container { padding: 16px; }
      .detail-row { flex-direction: column; gap: 6px; }
      .detail-label { width: 100%; }
      .header { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class TransactionDetailComponent implements OnInit {
  
  transaction: any = null;
  error: string = '';
  loading: boolean = true;  // ← AJOUT : variable de chargement

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef  // ← AJOUT : pour forcer la détection de changement
  ) {}

  ngOnInit() {
    // S'abonner aux changements de paramètres (plus robuste que snapshot)
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadTransaction();
      } else {
        this.error = "Aucun ID de transaction fourni";
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadTransaction() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();  // ← FORCER la mise à jour de l'UI
    
    console.log('Chargement transaction ID:', id);
    
    this.http.get(`${environment.apiUrl}/api/agent/messages/${id}`)
      .subscribe({
        next: (data: any) => {
          console.log('Transaction reçue:', data);
          this.transaction = data;
          this.loading = false;
          this.cdr.detectChanges();  // ← FORCER l'affichage après chargement
        },
        error: (err) => {
          console.error('Erreur:', err);
          const errorMsg = err.error?.message || "Impossible de charger la transaction";
          this.error = errorMsg;
          this.loading = false;
          this.cdr.detectChanges();  // ← FORCER l'affichage de l'erreur
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Erreur', 
            detail: errorMsg
          });
        }
      });
  }

  // ← MODIFICATION : retour vers le dashboard au lieu de "messages reçus"
  goBackToDashboard() {
    this.router.navigate(['/agent/dashboard']);
  }

  acceptTransaction() {
    if (!this.transaction) return;
    
    this.http.put(`${environment.apiUrl}/api/agent/messages/${this.transaction.id}/accepter`, {})
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Acceptée',
            detail: `Transaction ${this.transaction.msgId} acceptée`
          });
          setTimeout(() => this.goBackToDashboard(), 1500);
        },
        error: (err) => {
          const errorMsg = err.error || "Impossible d'accepter";
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: errorMsg
          });
        }
      });
  }

  rejectTransaction() {
    if (!this.transaction) return;
    
    this.http.put(`${environment.apiUrl}/api/agent/messages/${this.transaction.id}/rejeter`, "Rejeté depuis le détail")
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Rejetée',
            detail: `Transaction ${this.transaction.msgId} rejetée`
          });
          setTimeout(() => this.goBackToDashboard(), 1500);
        },
        error: (err) => {
          const errorMsg = err.error || "Impossible de rejeter";
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: errorMsg
          });
        }
      });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    this.messageService.add({
      severity: 'info',
      summary: 'Copié',
      detail: 'UETR copié dans le presse-papier'
    });
  }

  needsAgentAction(status: string): boolean {
    return status === 'EN_ATTENTE' || status === 'SIGNALE' || status === 'PDNG';
  }

  getStatusSeverity(status: string): "success" | "danger" | "warn" | "secondary" | "info" {
    switch (status) {
      case 'ACCEPTE': return 'success';
      case 'REJETE': return 'danger';
      case 'EN_ATTENTE': return 'warn';
      case 'EN_ATTENTE_CONFIRMATION': return 'info';
      case 'PDNG': return 'warn';
      case 'ACCP': return 'success';
      case 'RJCT': return 'danger';
      default: return 'secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'EN_ATTENTE': return 'PDNG (En attente)';
      case 'EN_ATTENTE_CONFIRMATION': return 'PDNG (Attente confirmation)';
      case 'ACCEPTE': return 'ACCP (Accepté)';
      case 'ACTC': return 'ACTC (Validé techniquement)';
      case 'ACSP': return 'ACSP (En cours de règlement)';
      case 'REJETE': return 'RJCT (Rejeté)';
      case 'PDNG': return 'PDNG (En attente)';
      case 'ACCP': return 'ACCP (Accepté)';
      case 'RJCT': return 'RJCT (Rejeté)';
      default: return status;
    }
  }

  getStatusTooltip(status: string): string {
    switch (status) {
      case 'EN_ATTENTE': return 'PDNG - En attente de traitement';
      case 'PDNG': return 'PDNG - En attente de traitement';
      case 'EN_ATTENTE_CONFIRMATION': return 'PDNG - En attente de confirmation bancaire';
      case 'ACCEPTE': return 'ACCP - Transaction acceptée par la banque';
      case 'ACCP': return 'ACCP - Transaction acceptée par la banque';
      case 'ACTC': return 'ACTC - Transaction validée techniquement';
      case 'ACSP': return 'ACSP - En cours de règlement';
      case 'REJETE': return 'RJCT - Transaction rejetée';
      case 'RJCT': return 'RJCT - Transaction rejetée';
      default: return status;
    }
  }

  getAlerteLabel(alerte: string): string {
    switch (alerte) {
      case 'OK': return '✓ Transaction conforme';
      case 'ATTENTION': return '⚠️ Alerte - À vérifier';
      case 'GRAVE': return '🔴 Alerte critique - Bloquer';
      default: return alerte;
    }
  }

  getAlerteSeverity(alerte: string): "success" | "warn" | "danger" | "info" {
    switch (alerte) {
      case 'OK': return 'success';
      case 'ATTENTION': return 'warn';
      case 'GRAVE': return 'danger';
      default: return 'info';
    }
  }

  getAlerteIcon(alerte: string): string {
    switch (alerte) {
      case 'OK': return 'pi-check-circle';
      case 'ATTENTION': return 'pi-exclamation-triangle';
      case 'GRAVE': return 'pi-ban';
      default: return 'pi-info-circle';
    }
  }
}