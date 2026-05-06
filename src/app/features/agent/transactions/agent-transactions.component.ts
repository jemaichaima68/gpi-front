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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  groupStatus?: string;
  direction?: string;
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

  selectedPeriod = 'all';
  customStartDate = '';
  customEndDate = '';
  showCustomDatePicker = false;
  dateFilterInfo = '';

  searchQuery = '';
  selectedType = '';
  selectedStatusFilter = '';

  showDetailDialog = false;
  selectedTransaction: SwiftMessage | null = null;

  showProcessDialog = false;
  currentTransaction: SwiftMessage | null = null;
  selectedProcessStatus = '';

  showRejectionReasonDialog = false;
  rejectionReasonText = '';
  pendingTransactionId: number | null = null;
  pendingTransactionMsgId = '';

  selectedStatus: { [key: number]: string } = {};
  rejectionReason: { [key: number]: string } = {};
  showMotifInput: { [key: number]: boolean } = {};

  private readonly API = `${environment.apiUrl}/api/agent/messages`;
  private routerSubscription: Subscription;
  private currentType = '';

  statusOptions = [
    { label: ' ACCP - Accepté', value: 'ACCP', description: 'Transaction acceptée, le paiement sera traité normalement.', color: '#10b981' },
    { label: ' RJCT - Rejeté', value: 'RJCT', description: 'Transaction rejetée. Un motif doit être fourni.', color: '#ef4444' },
    { label: ' PDNG - En attente', value: 'PDNG', description: 'Transaction mise en attente pour vérification supplémentaire.', color: '#f59e0b' },
    { label: ' ACTC - Validé technique', value: 'ACTC', description: 'Validation technique OK, en attente de traitement.', color: '#3b82f6' },
    { label: ' ACSP - En cours de règlement', value: 'ACSP', description: 'Acceptée, transfert en cours d’exécution.', color: '#8b5cf6' }
  ];

  typeFilterOptions = [
    { label: 'Tous les types', value: '' },
    { label: 'PACS008 - Client', value: 'PACS008' },
    { label: 'PACS009 - Interbancaire', value: 'PACS009' },
    { label: 'PACS002 - Réponse', value: 'PACS002' }
  ];

  statusFilterOptions = [
    { label: 'Tous les statuts', value: '' },
    { label: 'EN_ATTENTE', value: 'EN_ATTENTE' },
    { label: 'ACCEPTE', value: 'ACCEPTE' },
    { label: 'REJETE', value: 'REJETE' },
    { label: 'SIGNALE', value: 'SIGNALE' },
    { label: 'ENVOYE', value: 'ENVOYE' },
    { label: 'ACTC', value: 'ACTC' },
    { label: 'ACSP', value: 'ACSP' }
  ];

  exportOptions = [
    { label: 'CSV', icon: 'pi pi-file-excel', command: () => this.exportCsv() },
    { label: 'PDF', icon: 'pi pi-file-pdf', command: () => this.exportPdf() }
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
        console.error('Erreur:', error);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterByTransactionType(data: SwiftMessage[], type: string): SwiftMessage[] {
    switch (type) {
      case 'recus':
        return data.filter(tx =>
          (tx.messageType === 'PACS008' || tx.messageType === 'PACS009') &&
          (tx.status === 'EN_ATTENTE' || tx.status === 'PDNG' || tx.status === 'SIGNALE')
        );

      case 'emis':
        return data.filter(tx =>
          tx.direction === 'OUT' || tx.status === 'ENVOYE'
        );

      case 'traitees':
        return data.filter(tx =>
          (tx.messageType === 'PACS008' || tx.messageType === 'PACS009') &&
          (tx.status === 'ACCEPTE' || tx.status === 'REJETE' || tx.status === 'ACTC' || tx.status === 'ACSP')
        );

      default:
        return data;
    }
  }

  applySearchFilter(transactions: SwiftMessage[]): SwiftMessage[] {
    if (!this.searchQuery.trim()) return transactions;

    const query = this.searchQuery.toLowerCase();

    return transactions.filter(tx =>
      tx.msgId?.toLowerCase().includes(query) ||
      tx.uetr?.toLowerCase().includes(query) ||
      tx.debtorName?.toLowerCase().includes(query) ||
      tx.creditorName?.toLowerCase().includes(query) ||
      tx.instructingAgentBic?.toLowerCase().includes(query) ||
      tx.instructedAgentBic?.toLowerCase().includes(query)
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
      this.dateFilterInfo = 'Toutes les transactions';
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

        case 'yesterday': {
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          return txDateOnly.getTime() === yesterday.getTime();
        }

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
    this.updateDateFilterInfo();
    this.refreshCurrentView();
  }

  updateDateFilterInfo(): void {
    switch (this.selectedPeriod) {
      case 'today':
        this.dateFilterInfo = "Aujourd'hui";
        break;
      case 'yesterday':
        this.dateFilterInfo = 'Hier';
        break;
      case 'thisWeek':
        this.dateFilterInfo = 'Cette semaine';
        break;
      case 'thisMonth':
        this.dateFilterInfo = 'Ce mois-ci';
        break;
      case 'custom':
        this.dateFilterInfo = 'Période personnalisée';
        break;
      default:
        this.dateFilterInfo = 'Toutes les transactions';
    }
  }

  applyCustomDateFilter(): void {
    if (this.customStartDate && this.customEndDate) {
      const start = new Date(this.customStartDate);
      const end = new Date(this.customEndDate);

      if (start > end) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Dates invalides',
          detail: 'La date de début doit être antérieure à la date de fin',
          life: 3000
        });
        return;
      }

      this.refreshCurrentView();
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Dates requises',
        detail: 'Veuillez sélectionner une date de début et une date de fin',
        life: 3000
      });
    }
  }

  resetFilters(): void {
    this.selectedPeriod = 'all';
    this.showCustomDatePicker = false;
    this.customStartDate = '';
    this.customEndDate = '';
    this.searchQuery = '';
    this.selectedType = '';
    this.selectedStatusFilter = '';
    this.dateFilterInfo = '';
    this.refreshCurrentView();
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.selectedPeriod !== 'all' ||
      this.searchQuery ||
      this.selectedType ||
      this.selectedStatusFilter
    );
  }

  refreshCurrentView(): void {
    this.loadData(this.currentType);
  }

  getDebtorDisplay(tx: SwiftMessage | null): string {
    if (!tx) return '—';

    if (tx.messageType === 'PACS009') {
      return tx.instructingAgentBic || '—';
    }

    return tx.debtorName || '—';
  }

  getCreditorDisplay(tx: SwiftMessage | null): string {
    if (!tx) return '—';

    if (tx.messageType === 'PACS009') {
      return tx.instructedAgentBic || '—';
    }

    return tx.creditorName || '—';
  }

  getCountryDisplay(tx: SwiftMessage | null): string {
    if (!tx) return '—';

    if (tx.messageType === 'PACS009') {
      return '—';
    }

    return tx.creditorCountry || '—';
  }

  getDebtorLabel(tx: SwiftMessage | null): string {
    if (!tx) return 'Débiteur';
    return tx.messageType === 'PACS009' ? 'Banque émettrice (BIC)' : 'Débiteur';
  }

  getCreditorLabel(tx: SwiftMessage | null): string {
    if (!tx) return 'Créditeur';
    return tx.messageType === 'PACS009' ? 'Banque réceptrice (BIC)' : 'Créditeur';
  }

  exportCsv(): void {
    const headers = [
      'ID',
      'Type',
      'MsgId',
      'UETR',
      'Montant',
      'Devise',
      'Débiteur / Banque émettrice',
      'Créditeur / Banque réceptrice',
      'Pays',
      'Statut',
      'Alerte',
      'Date réception'
    ];

    const rows = this.transactions.map(tx => [
      tx.id,
      tx.messageType,
      tx.msgId,
      tx.uetr || '',
      tx.amount,
      tx.currency,
      this.getDebtorDisplay(tx),
      this.getCreditorDisplay(tx),
      this.getCountryDisplay(tx),
      this.getStatusLabel(tx.status),
      tx.alerte || 'OK',
      new Date(tx.receivedAt).toLocaleString('fr-FR')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    this.messageService.add({
      severity: 'success',
      summary: 'Export réussi',
      detail: `${this.transactions.length} transaction(s) exportée(s) au format CSV.`,
      life: 3000
    });
  }

  exportPdf(): void {
    const headers = [[
      'ID',
      'Type',
      'MsgId',
      'UETR',
      'Montant',
      'Devise',
      'Débiteur/Banque',
      'Créditeur/Banque',
      'Pays',
      'Statut',
      'Alerte',
      'Date'
    ]];

    const rows = this.transactions.map(tx => [
      tx.id.toString(),
      tx.messageType,
      tx.msgId,
      tx.uetr || '',
      `${tx.amount} ${tx.currency}`,
      tx.currency,
      this.getDebtorDisplay(tx),
      this.getCreditorDisplay(tx),
      this.getCountryDisplay(tx),
      this.getStatusLabel(tx.status),
      tx.alerte || 'OK',
      new Date(tx.receivedAt).toLocaleString('fr-FR')
    ]);

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('Liste des transactions SWIFT', 14, 15);
    doc.setFontSize(9);
    doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 14, 22);
    doc.text(`Total: ${this.transactions.length} transaction(s)`, 14, 29);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 35,
      theme: 'striped',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: 'bold'
      }
    });

    doc.save(`transactions_${new Date().toISOString().slice(0, 10)}.pdf`);

    this.messageService.add({
      severity: 'success',
      summary: 'Export réussi',
      detail: `${this.transactions.length} transaction(s) exportée(s) au format PDF.`,
      life: 3000
    });
  }

  openProcessDialog(transaction: SwiftMessage): void {
    this.currentTransaction = transaction;
    this.selectedProcessStatus = '';
    this.showProcessDialog = true;
  }

  closeProcessDialog(): void {
    this.showProcessDialog = false;
    this.currentTransaction = null;
    this.selectedProcessStatus = '';
  }

  confirmStatusSelection(): void {
    if (!this.currentTransaction) return;

    if (!this.selectedProcessStatus) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Statut requis',
        detail: 'Veuillez sélectionner un statut de traitement',
        life: 3000
      });
      return;
    }

    if (this.selectedProcessStatus === 'RJCT') {
      this.pendingTransactionId = this.currentTransaction.id;
      this.pendingTransactionMsgId = this.currentTransaction.msgId;
      this.rejectionReasonText = '';
      this.showProcessDialog = false;
      this.showRejectionReasonDialog = true;
    } else {
      this.sendDecision(
        this.currentTransaction.id,
        this.currentTransaction.msgId,
        this.selectedProcessStatus,
        ''
      );
      this.closeProcessDialog();
    }
  }

  sendDecision(transactionId: number, msgId: string, status: string, motif: string): void {
    this.http.put(
      `${this.API}/${transactionId}/confirmation`,
      { status, motif },
      { responseType: 'blob' }
    ).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `pacs.002_${msgId}_${Date.now()}.xml`;
        link.click();

        window.URL.revokeObjectURL(url);

        const statusLabel = this.statusOptions.find(s => s.value === status)?.label || status;

        this.messageService.add({
          severity: 'success',
          summary: 'Décision enregistrée',
          detail: `Transaction ${msgId} → ${statusLabel} - Fichier PACS002 téléchargé automatiquement`,
          life: 5000
        });

        this.refreshCurrentView();
        this.closeProcessDialog();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err.error?.message || "Impossible d'enregistrer la décision",
          life: 5000
        });
      }
    });
  }

  confirmRejectionWithReason(): void {
    if (!this.rejectionReasonText.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Motif requis',
        detail: 'Veuillez indiquer un motif de rejet détaillé',
        life: 3000
      });
      return;
    }

    if (this.pendingTransactionId && this.pendingTransactionMsgId) {
      this.sendDecision(
        this.pendingTransactionId,
        this.pendingTransactionMsgId,
        'RJCT',
        this.rejectionReasonText
      );
    }

    this.closeRejectionReasonDialog();
  }

  closeRejectionReasonDialog(): void {
    this.showRejectionReasonDialog = false;
    this.rejectionReasonText = '';
    this.pendingTransactionId = null;
    this.pendingTransactionMsgId = '';
  }

  showDetail(transaction: SwiftMessage): void {
    this.selectedTransaction = transaction;
    this.showDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.showDetailDialog = false;
    this.selectedTransaction = null;
  }

  sendConfirmation(id: number, msgId: string): void {
    const status = this.selectedStatus[id];

    if (!status) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Statut requis',
        detail: 'Veuillez sélectionner un statut',
        life: 3000
      });
      return;
    }

    const motif = this.rejectionReason[id] || '';

    if (status === 'RJCT' && !motif) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Motif requis',
        detail: 'Veuillez indiquer un motif de rejet',
        life: 3000
      });
      return;
    }

    this.http.put(`${this.API}/${id}/confirmation`, { status, motif })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Confirmation envoyée',
            detail: `Transaction ${msgId} → ${status}`,
            life: 3000
          });

          delete this.selectedStatus[id];
          delete this.rejectionReason[id];
          delete this.showMotifInput[id];

          this.refreshCurrentView();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: err.error || 'Impossible d’envoyer',
            life: 3000
          });
        }
      });
  }

  onStatusChange(id: number, status: string): void {
    this.showMotifInput[id] = status === 'RJCT';

    if (status !== 'RJCT') {
      this.rejectionReason[id] = '';
    }
  }

  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    switch (status) {
      case 'EN_ATTENTE':
      case 'PDNG':
        return 'warn';

      case 'ENVOYE':
      case 'EN_ATTENTE_CONFIRMATION':
      case 'ACTC':
      case 'ACSP':
        return 'info';

      case 'ACCEPTE':
      case 'ACCP':
        return 'success';

      case 'REJETE':
      case 'REJETE_AUTO':
      case 'RJCT':
        return 'danger';

      case 'SIGNALE':
        return 'warn';

      default:
        return 'secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'EN_ATTENTE':
      case 'PDNG':
        return 'PDNG (En attente)';

      case 'EN_ATTENTE_CONFIRMATION':
        return 'PDNG (Attente confirmation)';

      case 'ACCEPTE':
      case 'ACCP':
        return 'ACCP (Accepté)';

      case 'ACTC':
        return 'ACTC (Validé techniquement)';

      case 'ACSP':
        return 'ACSP (En cours de règlement)';

      case 'REJETE':
      case 'REJETE_AUTO':
      case 'RJCT':
        return 'RJCT (Rejeté)';

      case 'SIGNALE':
        return 'PDNG (Signalé)';

      case 'ENVOYE':
        return 'ENVOYÉ';

      default:
        return status;
    }
  }

  getStatusTooltip(status: string): string {
    switch (status) {
      case 'EN_ATTENTE':
      case 'PDNG':
        return 'PDNG - En attente de traitement';

      case 'EN_ATTENTE_CONFIRMATION':
        return 'PDNG - En attente de confirmation bancaire';

      case 'ACCEPTE':
      case 'ACCP':
        return 'ACCP - Transaction acceptée par la banque';

      case 'ACTC':
        return 'ACTC - Transaction validée techniquement';

      case 'ACSP':
        return 'ACSP - Transaction acceptée, en cours de règlement';

      case 'REJETE':
      case 'REJETE_AUTO':
      case 'RJCT':
        return 'RJCT - Transaction rejetée par la banque';

      case 'SIGNALE':
        return 'PDNG - Transaction signalée, nécessite une attention';

      case 'ENVOYE':
        return 'Message émis';

      default:
        return status;
    }
  }

  needsAgentAction(status: string): boolean {
    return status === 'EN_ATTENTE' || status === 'SIGNALE' || status === 'PDNG';
  }

  getAlerteSeverity(alerte: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (alerte) {
      case 'OK':
        return 'success';

      case 'ATTENTION':
        return 'warn';

      case 'GRAVE':
        return 'danger';

      default:
        return 'info';
    }
  }

  getAlerteLabel(alerte: string): string {
    switch (alerte) {
      case 'OK':
        return '✓ Conforme';

      case 'ATTENTION':
        return '⚠️ Attention';

      case 'GRAVE':
        return '🔴 Critique';

      default:
        return alerte;
    }
  }

  getAlerteIcon(alerte: string): string {
    switch (alerte) {
      case 'OK':
        return 'pi-check-circle';

      case 'ATTENTION':
        return 'pi-exclamation-triangle';

      case 'GRAVE':
        return 'pi-ban';

      default:
        return 'pi-info-circle';
    }
  }
}