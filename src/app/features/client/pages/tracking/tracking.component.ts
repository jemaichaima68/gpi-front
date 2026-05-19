import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TransferResponse, TransferService, TransactionTimelineDto } from '../../services/transfer.service';
import { ButtonModule } from 'primeng/button';
import { SplitButtonModule } from 'primeng/splitbutton';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonModule, SplitButtonModule],
  templateUrl: './tracking.component.html',
  styleUrls: ['./tracking.component.css']
})
export class TrackingComponent implements OnInit {
  uetrToSearch = '';
  transferDetails: TransferResponse | null = null;
  timeline: TransactionTimelineDto[] = [];
  errorMessage = '';
  isLoading = false;

  exportOptions: MenuItem[] = [
    { label: 'CSV', icon: 'pi pi-file-excel', command: () => this.exportCsv() },
    { label: 'PDF', icon: 'pi pi-file-pdf', command: () => this.exportPdf() }
  ];

  constructor(
    private route: ActivatedRoute,
    private service: TransferService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['uetr']) {
        this.uetrToSearch = params['uetr'];
        this.searchTransfer();
      } else {
        this.transferDetails = null;
        this.timeline = [];
        this.errorMessage = '';
        this.cdr.detectChanges();
      }
    });
  }

  searchTransfer(): void {
    if (!this.uetrToSearch || this.uetrToSearch.trim() === '') {
      this.errorMessage = 'Veuillez entrer un UETR valide';
      this.transferDetails = null;
      this.timeline = [];
      this.cdr.detectChanges();
      return;
    }

    this.errorMessage = '';
    this.transferDetails = null;
    this.timeline = [];
    this.isLoading = true;
    this.cdr.detectChanges();

    this.service.getTransferByUetr(this.uetrToSearch.trim()).subscribe({
      next: (res) => {
        this.transferDetails = res;
        this.isLoading = false;

        if (res.id) {
          this.loadTimeline(res.id);
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Aucun transfert trouvé avec cet UETR';
        this.transferDetails = null;
        this.timeline = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadTimeline(id: number): void {
    this.service.getTransactionTimeline(id).subscribe({
      next: (steps) => {
        this.timeline = steps || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.timeline = this.getLocalTimelineSteps();
        this.cdr.detectChanges();
      }
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PDNG':
      case 'EN_ATTENTE':
        return ' En attente';
      case 'ACCEPTE':
      case 'ACCP':
        return ' Acceptée';
      case 'REJETE':
      case 'RJCT':
        return ' Rejetée';
      case 'ANNULATION_EN_ATTENTE':
        return ' Annulation en cours';
      case 'ANNULEE':
        return 'Annulée';
      default:
        return status || '-';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ACCEPTE':
      case 'ACCP':
        return 'status-accepted';
      case 'REJETE':
      case 'RJCT':
        return 'status-rejected';
      case 'ANNULATION_EN_ATTENTE':
        return 'status-cancel-pending';
      case 'ANNULEE':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'ACCEPTE':
      case 'ACCP':
        return '✅';
      case 'REJETE':
      case 'RJCT':
        return '❌';
      case 'ANNULATION_EN_ATTENTE':
        return '🕓';
      case 'ANNULEE':
        return '🚫';
      default:
        return '⏳';
    }
  }

  getFormattedDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  iconToEmoji(icon: string): string {
    switch (icon) {
      case 'inbox': return '📥';
      case 'check-circle': return '✅';
      case 'times-circle': return '❌';
      case 'hourglass': return '⏳';
      case 'ban': return '🚫';
      case 'clock': return '🕓';
      default: return '•';
    }
  }

  getTimelineSteps(): any[] {
    if (this.timeline && this.timeline.length > 0) {
      return this.timeline.map(step => ({
        label: step.statusLabel,
        description: step.description,
        date: step.timestamp ? this.getFormattedDate(step.timestamp) : '',
        completed: step.completed,
        icon: this.iconToEmoji(step.icon)
      }));
    }

    return this.getLocalTimelineSteps();
  }

  private getLocalTimelineSteps(): any[] {
    const status = this.transferDetails?.status;
    const updatedAt = this.transferDetails?.updatedAt;
    const createdAt = this.transferDetails?.createdAt;
    const rejectionReason = this.transferDetails?.rejectionReason;

    const accepted = status === 'ACCEPTE' || status === 'ANNULATION_EN_ATTENTE' || status === 'ANNULEE';
    const rejected = status === 'REJETE';
    const cancelPending = status === 'ANNULATION_EN_ATTENTE';
    const cancelled = status === 'ANNULEE';

    return [
      {
        label: 'Transaction reçue',
        description: 'PACS.008 reçu et enregistré dans le système',
        date: this.getFormattedDate(createdAt),
        completed: true,
        icon: '📥'
      },
      {
        label: accepted ? 'Transaction acceptée' : (rejected ? 'Transaction rejetée' : 'En attente'),
        description: accepted
          ? 'PACS.002 ACCP généré : la transaction est acceptée'
          : rejected
            ? `PACS.002 RJCT généré : ${rejectionReason || 'motif non spécifié'}`
            : 'En attente de validation par notre équipe',
        date: accepted || rejected ? this.getFormattedDate(updatedAt) : '',
        completed: accepted || rejected,
        icon: accepted ? '✅' : rejected ? '❌' : '⏳'
      },
      {
        label: 'Demande d’annulation',
        description: cancelPending || cancelled
          ? 'CAMT.056 envoyé : demande d’annulation en cours'
          : 'Aucune demande d’annulation pour le moment',
        date: cancelPending || cancelled ? this.getFormattedDate(updatedAt) : '',
        completed: cancelPending || cancelled,
        icon: '🚫'
      },
      {
        label: 'Réponse annulation',
        description: cancelled
          ? 'CAMT.029 CNCL reçu : la transaction est annulée'
          : cancelPending
            ? 'En attente de réponse CAMT.029'
            : 'Aucune réponse CAMT.029',
        date: cancelled ? this.getFormattedDate(updatedAt) : '',
        completed: cancelled,
        icon: cancelled ? '✅' : '🕓'
      }
    ];
  }

  exportCsv(): void {
    if (!this.transferDetails) {
      alert('Aucun transfert à exporter');
      return;
    }

    const headers = [
      'UETR', 'Montant', 'Devise', 'Statut', 'Bénéficiaire',
      'Banque bénéficiaire', 'Donneur d’ordre', 'Date création',
      'Dernière mise à jour', 'Motif de rejet'
    ];

    const row = [
      this.transferDetails.uetr,
      this.transferDetails.amount,
      this.transferDetails.currency || 'EUR',
      this.getStatusLabel(this.transferDetails.status),
      this.transferDetails.beneficiaryName || '-',
      this.transferDetails.beneficiaryBank || '-',
      this.transferDetails.senderName || this.transferDetails.debtorName || '-',
      this.getFormattedDate(this.transferDetails.createdAt),
      this.getFormattedDate(this.transferDetails.updatedAt),
      this.transferDetails.rejectionReason || '-'
    ];

    const csvContent = [headers, row]
      .map(line => line.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transfert_${this.transferDetails.uetr.slice(0, 8)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  exportPdf(): void {
    if (!this.transferDetails) {
      alert('Aucun transfert à exporter');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(20);
    doc.setTextColor(26, 77, 140);
    doc.text('GPI Tracker - Détails du transfert', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Exporté le : ${new Date().toLocaleString('fr-FR')}`, pageWidth - 20, 30, { align: 'right' });

    autoTable(doc, {
      startY: 45,
      head: [['Champ', 'Valeur']],
      body: [
        ['UETR', this.transferDetails.uetr],
        ['Montant', `${this.transferDetails.amount} ${this.transferDetails.currency || 'EUR'}`],
        ['Statut', this.getStatusLabel(this.transferDetails.status)],
        ['Bénéficiaire', this.transferDetails.beneficiaryName || '-'],
        ['Banque bénéficiaire', this.transferDetails.beneficiaryBank || '-'],
        ['Donneur d’ordre', this.transferDetails.senderName || this.transferDetails.debtorName || '-'],
        ['Date création', this.getFormattedDate(this.transferDetails.createdAt)],
        ['Dernière mise à jour', this.getFormattedDate(this.transferDetails.updatedAt)],
        ['Motif de rejet', this.transferDetails.rejectionReason || '-']
      ],
      theme: 'striped',
      headStyles: { fillColor: [26, 77, 140], textColor: 255 },
      margin: { left: 14, right: 14 }
    });

    let finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Timeline PACS/CAMT', 14, finalY);
    finalY += 5;

    autoTable(doc, {
      startY: finalY,
      head: [['Étape', 'Description', 'État']],
      body: this.getTimelineSteps().map(step => [
        step.label,
        step.description,
        step.completed ? 'Terminé' : 'En attente'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [26, 77, 140], textColor: 255 },
      margin: { left: 14, right: 14 }
    });

    doc.save(`transfert_${this.transferDetails.uetr.slice(0, 8)}.pdf`);
  }
}
