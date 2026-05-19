import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';  // ✅ Correction : InputTextModule au lieu de InputTextareaModule
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';  // ✅ Ajout pour le select

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule,
    TooltipModule,
    DialogModule,
    InputTextModule,      // ✅ Correction
    RadioButtonModule,
    SelectModule          // ✅ Ajout
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './transaction-detail.component.html',
  styleUrls: ['./transaction-detail.component.css']
})
export class TransactionDetailComponent implements OnInit {
  
  transaction: any = null;
  relatedMessage: any = null;
  error: string = '';
  loading: boolean = true;
  
  // Dialogue traitement
  showProcessDialog: boolean = false;
  selectedDecision: string = '';
  rejectionReason: string = '';
  
  // Dialogue annulation
  showCancelDialog: boolean = false;
  cancelReasonCode: string = 'CUST';
  cancelReasonText: string = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadTransaction(id);
      } else {
        this.error = "Aucun ID de transaction fourni";
        this.loading = false;
      }
    });
  }

  loadTransaction(id: string) {
    this.loading = true;
    this.error = '';
    
    this.http.get<any>(`${environment.apiUrl}/api/agent/messages/${id}`)  // ✅ Typage any explicite
      .subscribe({
        next: (data: any) => {
          this.transaction = data;
          this.loadRelatedMessage(data);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.error = err.error?.message || "Impossible de charger la transaction";
          this.loading = false;
          this.cdr.detectChanges();
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Erreur', 
            detail: this.error
          });
        }
      });
  }
  retryLoad() {
  const id = this.route.snapshot.paramMap.get('id');
  if (id) {
    this.loadTransaction(id);
  }
}

  loadRelatedMessage(transaction: any) {
    // Chercher le message associé (PACS002 pour une réponse, ou CAMT056/029)
    if (transaction.originalMsgId || transaction.originalUetr) {
      this.http.get<any[]>(`${environment.apiUrl}/api/agent/messages/all`)  // ✅ Typage explicite
        .subscribe({
          next: (messages: any[]) => {
            // Chercher un message qui répond à cette transaction
            this.relatedMessage = messages.find(msg => 
              (msg.originalMsgId === transaction.msgId || 
               msg.originalUetr === transaction.uetr) &&
              msg.messageType !== transaction.messageType
            );
          },
          error: () => {}
        });
    }
  }

  goBackToDashboard() {
    this.router.navigate(['/agent/dashboard']);
  }

  copyToClipboard(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    this.messageService.add({
      severity: 'success',
      summary: 'Copié',
      detail: 'Texte copié dans le presse-papier'
    });
  }

  viewRelatedMessage(id: number) {
    this.router.navigate(['/agent/transaction', id]);
  }

  // ==================== TRAITEMENT (ACCEPTER/REJETER) ====================
  
  openProcessDialog(defaultDecision: string = 'ACCP') {
    this.selectedDecision = defaultDecision;
    this.rejectionReason = '';
    this.showProcessDialog = true;
  }

  closeProcessDialog() {
    this.showProcessDialog = false;
    this.selectedDecision = '';
    this.rejectionReason = '';
  }

  confirmProcess() {
    if (!this.selectedDecision) {
      this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Choisissez une décision' });
      return;
    }

    if (this.selectedDecision === 'RJCT' && !this.rejectionReason.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Motif requis', detail: 'Saisissez un motif de rejet' });
      return;
    }

    this.http.put(`${environment.apiUrl}/api/agent/messages/${this.transaction.id}/confirmation`, {
      status: this.selectedDecision,
      motif: this.rejectionReason
    }, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const decisionText = this.selectedDecision === 'ACCP' ? 'acceptée' : 'rejetée';
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Succès', 
          detail: `Transaction ${decisionText} avec succès` 
        });
        this.closeProcessDialog();
        setTimeout(() => this.loadTransaction(this.transaction.id), 1000);
      },
      error: (err: any) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Erreur', 
          detail: err.error?.message || 'Impossible de traiter la transaction' 
        });
      }
    });
  }

  // ==================== ANNULATION (CAMT.056) ====================

  openCancelDialog() {
    this.cancelReasonCode = 'CUST';
    this.cancelReasonText = '';
    this.showCancelDialog = true;
  }

  closeCancelDialog() {
    this.showCancelDialog = false;
  }

  confirmCancellation() {
    this.http.post(`${environment.apiUrl}/api/agent/messages/${this.transaction.id}/cancel`, {
      reasonCode: this.cancelReasonCode,
      reasonText: this.cancelReasonText
    }, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Annulation demandée', 
          detail: 'CAMT.056 généré avec succès' 
        });
        this.closeCancelDialog();
        setTimeout(() => this.loadTransaction(this.transaction.id), 1000);
      },
      error: (err: any) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Erreur', 
          detail: err.error?.message || 'Impossible de générer CAMT.056' 
        });
      }
    });
  }

  // ==================== MÉTHODES UTILITAIRES ====================

  needsAgentAction(status: string): boolean {
    if (!status) return false;
    return status === 'PDNG' || status === 'EN_ATTENTE';
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PDNG': return 'PDNG - En attente';
      case 'EN_ATTENTE': return 'PDNG - En attente';
      case 'ACCEPTE': return 'ACCP - Accepté';
      case 'REJETE': return 'RJCT - Rejeté';
      case 'ANNULEE': return 'Annulée';
      case 'ENVOYE': return 'Envoyé';
      case 'RECEIVED': return 'Reçu';
      case 'TRAITE': return 'Traité';
      default: return status || '-';
    }
  }

  getAlerteLabel(alerte: string): string {
    switch (alerte) {
      case 'OK': return '✓ Transaction conforme';
      case 'ATTENTION': return '⚠️ Alerte - À vérifier';
      case 'GRAVE': return '🔴 Alerte critique - Bloquer';
      default: return alerte || '-';
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