import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SplitButtonModule } from 'primeng/splitbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { environment } from '../../../../environments/environment';
import { filter, Subscription } from 'rxjs';

export interface SwiftMessage {
  id: number;
  msgId: string;
  messageType: string;
  uetr: string;
  amount: number;
  currency: string;
  debtorName?: string;
  creditorName?: string;
  debtorCountry?: string;
  creditorCountry?: string;
  debtorIban?: string;
  creditorIban?: string;
  instructingAgentBic?: string;
  instructedAgentBic?: string;
  debtorAgentBic?: string;
  creditorAgentBic?: string;
  status: string;
  alerte?: string;
  motifAlerte?: string;
  receivedAt: string;
  rejectionReason?: string;
  originalMsgId?: string;
  originalUetr?: string;
  groupStatus?: string;
  direction?: string;
  cancellationStatus?: string;
  cancellationReason?: string;
  cancellationReasonText?: string;
  validatedBy?: string;
  validatedAt?: string;
}

@Component({
  selector: 'app-agent-transactions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SplitButtonModule,
    TableModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    InputTextModule,
    DialogModule,
    TooltipModule,
    SelectModule,
    RadioButtonModule,
    IconFieldModule,
    InputIconModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './agent-transactions.component.html',
  styleUrls: ['./agent-transactions.component.css']
})
export class AgentTransactionsComponent implements OnInit, OnDestroy {

  loading = false;
  pageTitle = 'Transactions';
  transactions: SwiftMessage[] = [];

  activeTab: string = 'pacs';
  selectedPeriod = 'all';
  customStartDate = '';
  customEndDate = '';
  showCustomDatePicker = false;
  dateFilterInfo = '';

  searchQuery = '';
  selectedType = '';
  selectedStatusFilter = '';
  showDetailDialog: boolean = false;
  selectedTransaction: SwiftMessage | null = null;


  showProcessDialog = false;
  currentTransaction: SwiftMessage | null = null;
  selectedProcessStatus = '';
  rejectionReasonText = '';

  showCancelDialog = false;
  cancelTransaction: SwiftMessage | null = null;
  cancelReasonCode = 'CUST';
  cancelReasonText = '';

  showRespondToCancellationDialog = false;
  respondToCamt056: SwiftMessage | null = null;
  selectedResponseStatus = '';
  responseReasonText = '';
 
  responseStatusOptions = [
    { label: 'CNCL - Accepter l\'annulation', value: 'CNCL', severity: 'success', description: 'La transaction sera définitivement annulée.' },
    { label: 'RJCR - Rejeter l\'annulation', value: 'RJCR', severity: 'danger', description: 'La demande d\'annulation est rejetée.' },
    { label: 'PDCR - En attente', value: 'PDCR', severity: 'warn', description: 'L\'annulation est en cours de traitement.' }
  ];

  private readonly API = `${environment.apiUrl}/api/agent/messages`;
  private routerSubscription: Subscription;
  private currentType = '';

  statusOptions = [
    { label: 'ACCP - Accepter', value: 'ACCP' },
    { label: 'RJCT - Rejeter', value: 'RJCT' }
  ];

  typeFilterOptions = [
    { label: 'Tous les types', value: '' },
    { label: 'PACS008 - Client', value: 'PACS008' },
    { label: 'PACS009 - Interbancaire', value: 'PACS009' },
    { label: 'PACS002 - Réponse', value: 'PACS002' },
    { label: 'CAMT056 - Demande annulation', value: 'CAMT056' },
    { label: 'CAMT029 - Réponse annulation', value: 'CAMT029' }
  ];

 statusFilterOptions = [
  { label: 'Tous les statuts', value: '' },
  { label: 'EN_ATTENTE - En attente', value: 'EN_ATTENTE' },
  { label: 'ACCP - Accepté', value: 'ACCEPTE' },
  { label: 'RJCT - Rejeté', value: 'REJETE' },
  { label: 'Annulation en attente', value: 'ANNULATION_EN_ATTENTE' },
  { label: 'Annulée', value: 'ANNULEE' },
  { label: 'Envoyé', value: 'ENVOYE' },
  { label: 'Reçu', value: 'RECEIVED' }
];

  cancelReasonOptions = [
    { label: 'CUST - Demandé par le client', value: 'CUST' },
    { label: 'DUPL - Paiement en double', value: 'DUPL' },
    { label: 'FRAD - Origine frauduleuse', value: 'FRAD' },
    { label: 'CURR - Devise incorrecte', value: 'CURR' },
    { label: 'AM09 - Montant incorrect', value: 'AM09' },
    { label: 'TECH - Problème technique', value: 'TECH' },
    { label: 'UPAY - Paiement indu', value: 'UPAY' },
    { label: 'AGNT - Agent incorrect', value: 'AGNT' },
    { label: 'COVR - Annulation couverture', value: 'COVR' }
  ];

  exportOptions = [
    { label: 'CSV', icon: 'pi pi-file-excel', command: () => this.exportCsv() },
    { label: 'PDF', icon: 'pi pi-file-pdf', command: () => this.exportToPdf() }
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => this.loadCurrentView());
  }

  ngOnInit(): void {
    this.loadCurrentView();
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  loadCurrentView(): void {
    const urlSegments = this.router.url.split('/');
    const type = urlSegments[urlSegments.length - 1];
    this.currentType = type;
    this.setPageTitle(type);
    this.loadData(type);
  }

canAcceptTransaction(tx: SwiftMessage): boolean {
  // Si l'alerte est "GRAVE", on désactive l'acceptation
  if (tx.alerte === 'GRAVE') {
    return false;
  }
  return true;
}

  refreshCurrentView(): void {
    this.loadData(this.currentType);
  }

  setPageTitle(type: string): void {
    switch (type) {
      case 'recus':
        this.pageTitle = 'Messages reçus';
        break;
      case 'emis':
        this.pageTitle = 'Messages émis';
        break;
      case 'traitees':
        this.pageTitle = 'Transactions traitées';
        break;
      default:
        this.pageTitle = 'Transactions';
    }
  }

  loadData(type: string): void {
    this.loading = true;
    
    this.http.get<SwiftMessage[]>(`${this.API}/all`).subscribe({
      next: (data) => {
        let filtered = this.filterByTransactionType(data, type);
        filtered = this.applyDateFilter(filtered);
        filtered = this.applySearchFilter(filtered);
        filtered = this.applyTypeFilter(filtered);
        filtered = this.applyStatusFilter(filtered);

        this.transactions = filtered;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les transactions.'
        });
        this.cdr.detectChanges();
      }
    });
  }
  
  showDetail(tx: SwiftMessage) {
    this.selectedTransaction = tx;
    this.showDetailDialog = true;
  }
  // Vérifie si l'acceptation est autorisée
isAcceptDisabled(tx: SwiftMessage): boolean {
  return tx.alerte === 'GRAVE';
}

// Récupère le message d'outil pour le bouton Accepter
getAcceptTooltip(tx: SwiftMessage): string {
  if (tx.alerte === 'GRAVE') {
    return '❌ Transaction avec alerte GRAVE - Acceptation impossible. Seul le rejet est autorisé.';
  }
  return 'Accepter cette transaction';
}

// Vérifie si le bouton Confirmer doit être désactivé dans le dialogue
isConfirmDisabled(): boolean {
  if (!this.currentTransaction) return true;
  // Si alerte GRAVE, seule l'option RJCT est valide
  if (this.currentTransaction.alerte === 'GRAVE') {
    return this.selectedProcessStatus !== 'RJCT';
  }
  return !this.selectedProcessStatus;
}
  closeDetailDialog() {
    this.showDetailDialog = false;
    this.selectedTransaction = null;
  }

  filterByTransactionType(data: SwiftMessage[], type: string): SwiftMessage[] {
    switch (type) {
      case 'recus':
        return data.filter(tx => {
          // Transactions PACS008/009 en attente (EN_ATTENTE ou PDNG)
          const isPaymentPending = (tx.messageType === 'PACS008' || tx.messageType === 'PACS009') 
                                    && (tx.status === 'EN_ATTENTE' || tx.status === 'PDNG');
          
          // CAMT056 reçus (demandes d'annulation)
          const isCamt056Received = tx.messageType === 'CAMT056' && tx.direction === 'IN';
          
          // PACS002 reçus
          const isPacs002Received = tx.messageType === 'PACS002' && tx.direction === 'IN';
          
          // CAMT029 reçus
          const isCamt029Received = tx.messageType === 'CAMT029' && tx.direction === 'IN';
          
          return isPaymentPending || isCamt056Received || isPacs002Received || isCamt029Received;
        });
        
      case 'emis':
        return data.filter(tx => tx.direction === 'OUT' || tx.status === 'ENVOYE');
        
      case 'traitees':
        return data.filter(tx => {
          const isPayment = tx.messageType === 'PACS008' || tx.messageType === 'PACS009';
          const isProcessed = tx.status === 'ACCEPTE' || tx.status === 'REJETE';
          return isPayment && isProcessed;
        });
        
      default:
        return data;
    }
  }
  
  applySearchFilter(transactions: SwiftMessage[]): SwiftMessage[] {
    if (!this.searchQuery.trim()) return transactions;
    const q = this.searchQuery.toLowerCase();

    return transactions.filter(tx =>
      tx.msgId?.toLowerCase().includes(q) ||
      tx.uetr?.toLowerCase().includes(q) ||
      tx.originalUetr?.toLowerCase().includes(q) ||
      tx.debtorName?.toLowerCase().includes(q) ||
      tx.creditorName?.toLowerCase().includes(q) ||
      tx.instructingAgentBic?.toLowerCase().includes(q) ||
      tx.instructedAgentBic?.toLowerCase().includes(q)
    );
  }

  applyTypeFilter(transactions: SwiftMessage[]): SwiftMessage[] {
    if (!this.selectedType) return transactions;
    return transactions.filter(tx => tx.messageType === this.selectedType);
  }

  applyStatusFilter(transactions: SwiftMessage[]): SwiftMessage[] {
    if (!this.selectedStatusFilter) return transactions;
    return transactions.filter(tx => tx.status === this.selectedStatusFilter);
  }

  applyDateFilter(transactions: SwiftMessage[]): SwiftMessage[] {
    if (this.selectedPeriod === 'all') {
      return transactions;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return transactions.filter(tx => {
      const txDate = new Date(tx.receivedAt);
      const txDateOnly = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());

      switch (this.selectedPeriod) {
        case 'today':
          return txDateOnly.getTime() === today.getTime();

        case 'thisWeek': {
          const weekStart = new Date(today);
          const dayOfWeek = today.getDay();
          const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          weekStart.setDate(today.getDate() - diffToMonday);
          return txDate >= weekStart;
        }

        case 'thisMonth': {
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          return txDate >= monthStart;
        }

        case 'custom':
          if (this.customStartDate && this.customEndDate) {
            const start = new Date(this.customStartDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(this.customEndDate);
            end.setHours(23, 59, 59, 999);
            return txDate >= start && txDate <= end;
          }
          return true;

        default:
          return true;
      }
    });
  }

  onPeriodChange(period: string): void {
    this.selectedPeriod = period;
    this.showCustomDatePicker = period === 'custom';
    this.refreshCurrentView();
  }

  applyCustomDateFilter(): void {
    this.selectedPeriod = 'custom';
    this.refreshCurrentView();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedType = '';
    this.selectedStatusFilter = '';
    this.selectedPeriod = 'all';
    this.customStartDate = '';
    this.customEndDate = '';
    this.showCustomDatePicker = false;
    this.refreshCurrentView();
  }

  get hasActiveFilters(): boolean {
    return !!this.searchQuery || !!this.selectedType || !!this.selectedStatusFilter || this.selectedPeriod !== 'all';
  }
  
  get pacsTransactions(): SwiftMessage[] {
    return this.transactions.filter(tx => 
      tx.messageType === 'PACS008' || tx.messageType === 'PACS009' || tx.messageType === 'PACS002'
    );
  }

  get camtTransactions(): SwiftMessage[] {
    return this.transactions.filter(tx => 
      tx.messageType === 'CAMT056' || tx.messageType === 'CAMT029'
    );
  }

  get displayedTransactions(): SwiftMessage[] {
    return this.activeTab === 'pacs' ? this.pacsTransactions : this.camtTransactions;
  }

needsAgentAction(status: string): boolean {
  // Statuts qui nécessitent une action agent
  const pendingStatuses = ['EN_ATTENTE', 'PDNG', 'ENVOYE', 'PENDING'];
  return pendingStatuses.includes(status);
}

  needsResponseToCamt056(tx: SwiftMessage): boolean {
    return tx.messageType === 'CAMT056' && 
           tx.direction === 'IN' && 
           tx.status !== 'TRAITE' &&
           tx.status !== 'REPONDU';
  }

  viewRelatedMessage(id: number) {
    this.router.navigate(['/agent/transactions', id]);
  }

openProcessDialog(tx: SwiftMessage): void {
  this.currentTransaction = tx;
  this.selectedProcessStatus = '';
  this.rejectionReasonText = '';
  
  // Si alerte GRAVE, on force le statut à RJCT
  if (tx.alerte === 'GRAVE') {
    this.selectedProcessStatus = 'RJCT';
    this.messageService.add({
      severity: 'warn',
      summary: '⚠️ Alerte critique',
      detail: 'Cette transaction a une alerte GRAVE. Seul le rejet est autorisé.',
      life: 5000
    });
  }
  
  this.showProcessDialog = true;
}
  
  closeProcessDialog(): void {
    this.showProcessDialog = false;
    this.currentTransaction = null;
    this.selectedProcessStatus = '';
    this.rejectionReasonText = '';
  }

  confirmProcess(): void {
    if (!this.currentTransaction || !this.selectedProcessStatus) {
      this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Choisissez ACCP ou RJCT.' });
      return;
    }

    if (this.selectedProcessStatus === 'RJCT' && !this.rejectionReasonText.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Motif obligatoire', detail: 'Saisissez le motif de rejet.' });
      return;
    }

    this.http.put(`${this.API}/${this.currentTransaction.id}/confirmation`, {
      status: this.selectedProcessStatus,
      motif: this.rejectionReasonText
    }, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `pacs.002_${this.currentTransaction?.msgId}_${Date.now()}.xml`);
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Décision enregistrée et PACS002 généré.' });
        this.closeProcessDialog();
        this.refreshCurrentView();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Traitement impossible.' });
      }
    });
  }

  openCancelDialog(tx: SwiftMessage): void {
    this.cancelTransaction = tx;
    this.cancelReasonCode = 'CUST';
    this.cancelReasonText = '';
    this.showCancelDialog = true;
  }

  closeCancelDialog(): void {
    this.showCancelDialog = false;
    this.cancelTransaction = null;
    this.cancelReasonCode = 'CUST';
    this.cancelReasonText = '';
  }

  confirmCancellation(): void {
    if (!this.cancelTransaction) return;

    this.http.post(`${this.API}/${this.cancelTransaction.id}/cancel`, {
      reasonCode: this.cancelReasonCode,
      reasonText: this.cancelReasonText
    }, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `camt.056_${this.cancelTransaction?.msgId}_${Date.now()}.xml`);
        this.messageService.add({ severity: 'success', summary: 'Annulation demandée', detail: 'CAMT.056 généré.' });
        this.closeCancelDialog();
        this.refreshCurrentView();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Annulation impossible.' });
      }
    });
  }

  openRespondToCancellationDialog(camt056: SwiftMessage): void {
    this.respondToCamt056 = camt056;
    this.selectedResponseStatus = '';
    this.responseReasonText = '';
    this.showRespondToCancellationDialog = true;
  }

  closeRespondToCancellationDialog(): void {
    this.showRespondToCancellationDialog = false;
    this.respondToCamt056 = null;
    this.selectedResponseStatus = '';
    this.responseReasonText = '';
  }

  confirmResponseToCancellation(): void {
    if (!this.respondToCamt056 || !this.selectedResponseStatus) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Attention', 
        detail: 'Veuillez choisir une réponse (CNCL, RJCR ou PDCR).' 
      });
      return;
    }
    
    if (this.selectedResponseStatus === 'RJCR' && !this.responseReasonText.trim()) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Motif obligatoire', 
        detail: 'Veuillez saisir le motif du rejet.' 
      });
      return;
    }
    
    this.http.post(`${this.API}/cancellation/${this.respondToCamt056.id}/respond`, {
      responseStatus: this.selectedResponseStatus,
      reasonText: this.responseReasonText
    }, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const statusLabel = this.selectedResponseStatus === 'CNCL' ? 'Annulation acceptée' :
                            this.selectedResponseStatus === 'RJCR' ? 'Annulation rejetée' : 'En attente';
        this.downloadBlob(blob, `camt.029_response_${this.respondToCamt056?.msgId}_${Date.now()}.xml`);
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Succès', 
          detail: `CAMT.029 généré avec succès (${statusLabel})` 
        });
        this.closeRespondToCancellationDialog();
        this.refreshCurrentView();
      },
      error: (err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Erreur', 
          detail: err.error?.message || 'Impossible de générer la réponse.' 
        });
      }
    });
  }

  downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  }

getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
  switch (status) {
    case 'EN_ATTENTE':
    case 'ANNULATION_EN_ATTENTE':
      return 'warn';
    case 'ACCEPTE':
    case 'ACCP':
      return 'success';
    case 'REJETE':
    case 'RJCT':
      return 'danger';
    case 'ANNULEE':
      return 'secondary';
    case 'ENVOYE':
    case 'RECEIVED':
      return 'info';
    default:
      return 'secondary';
  }
}

  getStatusLabel(status: string): string {
  switch (status) {
    case 'EN_ATTENTE': return 'En attente';
    case 'ACCEPTE': return 'ACCP - Accepté';
    case 'REJETE': return 'RJCT - Rejeté';
    case 'ANNULATION_EN_ATTENTE': return 'Annulation en attente';
    case 'ANNULEE': return 'Annulée';
    case 'ENVOYE': return 'Envoyé';
    case 'RECEIVED': return 'Reçu';
    default: return status || '-';
  }
}

  getStatusTooltip(status: string): string {
    switch (status) {
      case 'PDNG': return 'Transaction en attente de décision agent';
      case 'EN_ATTENTE': return 'Transaction en attente de décision agent';
      case 'ACCEPTE': return 'Transaction acceptée';
      case 'REJETE': return 'Transaction rejetée';
      case 'ANNULATION_EN_ATTENTE': return 'Demande CAMT.056 en cours';
      case 'ANNULEE': return 'Annulation acceptée par CAMT.029';
      default: return status || '';
    }
  }

  getDebtorDisplay(tx: SwiftMessage): string {
    return tx.debtorName || tx.debtorIban || tx.instructingAgentBic || '-';
  }

  getCreditorDisplay(tx: SwiftMessage): string {
    return tx.creditorName || tx.creditorIban || tx.instructedAgentBic || '-';
  }

  getCountryDisplay(tx: SwiftMessage): string {
    return tx.creditorCountry || tx.debtorCountry || '-';
  }

  getAlerteLabel(alerte?: string): string {
    if (!alerte) return '-';
    if (alerte === 'OK') return 'OK';
    if (alerte === 'ATTENTION') return 'Attention';
    if (alerte === 'GRAVE') return 'Grave';
    return alerte;
  }

  getAlerteSeverity(alerte?: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    if (alerte === 'OK') return 'success';
    if (alerte === 'ATTENTION') return 'warn';
    if (alerte === 'GRAVE') return 'danger';
    return 'secondary';
  }

  getAlerteIcon(alerte?: string): string {
    if (alerte === 'GRAVE') return 'pi-exclamation-triangle';
    if (alerte === 'ATTENTION') return 'pi-info-circle';
    return 'pi-check-circle';
  }

  getReasonDescription(code: string): string {
    const found = this.cancelReasonOptions.find(r => r.value === code);
    return found ? found.label : '';
  }

  exportToPdf(): void {
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDF({ orientation: 'landscape' });
        
        doc.setFontSize(14);
        doc.setTextColor(37, 99, 235);
        doc.text(this.pageTitle, 14, 15);
        
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`Exporté le ${new Date().toLocaleString()}`, 14, 25);
        
        const tableData = this.transactions.map(tx => [
          tx.messageType,
          tx.msgId,
          tx.uetr?.substring(0, 12) + '...',
          `${tx.amount} ${tx.currency}`,
          this.getDebtorDisplay(tx).substring(0, 25),
          this.getCreditorDisplay(tx).substring(0, 25),
          this.getStatusLabel(tx.status),
          new Date(tx.receivedAt).toLocaleDateString()
        ]);
        
        (doc as any).autoTable({
          head: [['Type', 'MsgId', 'UETR', 'Montant', 'Débiteur', 'Créditeur', 'Statut', 'Date']],
          body: tableData,
          startY: 35,
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 35 },
            2: { cellWidth: 30 },
            3: { cellWidth: 25 },
            4: { cellWidth: 40 },
            5: { cellWidth: 40 },
            6: { cellWidth: 25 },
            7: { cellWidth: 25 }
          }
        });
        
        doc.save(`${this.pageTitle.replace(/ /g, '_')}_${Date.now()}.pdf`);
      });
    }).catch(() => {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de générer le PDF' });
    });
  }

  exportCsv(): void {
    const rows = this.transactions.map(tx => ({
      Type: tx.messageType,
      MsgId: tx.msgId,
      UETR: tx.uetr,
      Montant: tx.amount,
      Devise: tx.currency,
      Statut: tx.status
    }));

    const csv = [
      Object.keys(rows[0] || {}).join(';'),
      ...rows.map(row => Object.values(row).join(';'))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, 'transactions.csv');
  }
}