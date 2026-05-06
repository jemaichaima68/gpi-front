import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { TransferResponse, TransferService } from '../../services/transfer.service';

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tracking.component.html',
  styleUrls: ['./tracking.component.css']
})
export class TrackingComponent implements OnInit {
  uetrToSearch: string = '';
  transferDetails: TransferResponse | null = null;
  errorMessage: string = '';
  userInitials: string = 'HJ';
  currentDate: Date = new Date();

  constructor(
    private route: ActivatedRoute,
    private service: TransferService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['uetr']) {
        this.uetrToSearch = params['uetr'];
        this.searchTransfer();
      }
    });
  }

  searchTransfer() {
    if (!this.uetrToSearch || this.uetrToSearch.trim() === '') {
      this.errorMessage = 'Veuillez entrer un UETR valide';
      this.transferDetails = null;
      return;
    }

    this.errorMessage = '';
    
    this.service.getTransferByUetr(this.uetrToSearch).subscribe({
      next: (res) => {
        this.transferDetails = res;
        console.log('✅ Transfert trouvé:', res);
      },
      error: (err) => {
        console.error('❌ Erreur recherche:', err);
        this.errorMessage = 'Aucun transfert trouvé avec cet UETR';
        this.transferDetails = null;
      }
    });
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'PDNG': 'En attente',
      'ACSC': 'Terminé',
      'RJCT': 'Rejeté',
      'ACTC': 'Validation technique',
      'ACSP': 'En traitement'
    };
    return map[status] || status;
  }

  getStatusDate(): string {
    if (this.transferDetails?.status === 'ACSC' && this.transferDetails?.updatedAt) {
      return new Date(this.transferDetails.updatedAt).toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
    }
    return new Date().toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  // ========== EXPORT PDF ==========
  exportPdf() {
    if (!this.transferDetails) {
      alert('Aucun transfert à exporter');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(20);
    doc.setTextColor(102, 126, 234);
    doc.text('GPI Tracker - Détails du transfert', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Exporté le: ${new Date().toLocaleString('fr-FR')}`, pageWidth - 20, 30, { align: 'right' });
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Informations du transfert', 14, 45);
    
    autoTable(doc, {
      startY: 50,
      head: [['Champ', 'Valeur']],
      body: [
        ['UETR', this.transferDetails.uetr],
        ['Montant', `${this.transferDetails.amount} ${this.transferDetails.currency || 'EUR'}`],
        ['Statut', this.getStatusLabel(this.transferDetails.status)],
        ['Bénéficiaire', this.transferDetails.beneficiaryName || '-'],
        ['Banque bénéficiaire', this.transferDetails.beneficiaryBank || '-'],
        ['Date création', new Date(this.transferDetails.createdAt).toLocaleString('fr-FR')],
        ['Dernière mise à jour', new Date(this.transferDetails.updatedAt).toLocaleString('fr-FR')]
      ],
      theme: 'striped',
      headStyles: { fillColor: [102, 126, 234], textColor: 255 },
      margin: { left: 14, right: 14 }
    });
    
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.text('Parcours du virement SWIFT GPI', 14, finalY);
    finalY += 5;
    
    // ✅ Utilisation des données dynamiques du backend
    const journeyBody = (this.transferDetails.bankJourney || []).map(bank => [
      bank.bankName,
      bank.role,
      bank.fees || '-',
      bank.status
    ]);
    
    autoTable(doc, {
      startY: finalY,
      head: [['Banque', 'Rôle', 'Frais', 'Statut']],
      body: journeyBody,
      theme: 'striped',
      headStyles: { fillColor: [102, 126, 234], textColor: 255 },
      margin: { left: 14, right: 14 }
    });
    
    finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.text('Résumé des frais déduits', 14, finalY);
    finalY += 5;
    
    autoTable(doc, {
      startY: finalY,
      body: [
        ['Frais totaux', `${this.transferDetails.totalFees?.toFixed(2) || '0.00'} EUR`],
        ['Montant net crédité', `${this.transferDetails.netAmount?.toFixed(2) || '0.00'} ${this.transferDetails.currency === 'EUR' ? 'USD' : this.transferDetails.currency || 'EUR'}`]
      ],
      theme: 'plain',
      margin: { left: 14, right: 14 }
    });
    
    doc.save(`transfert_${this.transferDetails.uetr.slice(0, 8)}.pdf`);
  }

  // ========== EXPORT EXCEL ==========
  exportExcel() {
    if (!this.transferDetails) {
      alert('Aucun transfert à exporter');
      return;
    }

    const data = [
      { Field: 'UETR', Value: this.transferDetails.uetr },
      { Field: 'Montant', Value: `${this.transferDetails.amount} ${this.transferDetails.currency || 'EUR'}` },
      { Field: 'Statut', Value: this.getStatusLabel(this.transferDetails.status) },
      { Field: 'Bénéficiaire', Value: this.transferDetails.beneficiaryName || '-' },
      { Field: 'Compte bénéficiaire', Value: this.transferDetails.beneficiaryAccount || '-' },
      { Field: 'Banque bénéficiaire', Value: this.transferDetails.beneficiaryBank || '-' },
      { Field: 'Donneur d\'ordre', Value: this.transferDetails.senderName || '-' },
      { Field: 'Date création', Value: new Date(this.transferDetails.createdAt).toLocaleString('fr-FR') },
      { Field: 'Dernière mise à jour', Value: new Date(this.transferDetails.updatedAt).toLocaleString('fr-FR') }
    ];
    
    // ✅ Utilisation des données dynamiques du backend
    const journeyData = (this.transferDetails.bankJourney || []).map((bank, index) => ({
      Etape: bank.step || (index + 1),
      Banque: bank.bankName,
      Rôle: bank.role,
      Frais: bank.fees || '-',
      Statut: bank.status
    }));
    
    const feesData = [
      { Description: 'Frais totaux', Montant: `${this.transferDetails.totalFees?.toFixed(2) || '0.00'} EUR` },
      { Description: 'Montant net crédité', Montant: `${this.transferDetails.netAmount?.toFixed(2) || '0.00'} ${this.transferDetails.currency === 'EUR' ? 'USD' : this.transferDetails.currency || 'EUR'}` }
    ];
    
    const wb = XLSX.utils.book_new();
    
    const ws1 = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws1, 'Informations');
    
    const ws2 = XLSX.utils.json_to_sheet(journeyData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Parcours SWIFT');
    
    const ws3 = XLSX.utils.json_to_sheet(feesData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Frais');
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `transfert_${this.transferDetails.uetr.slice(0, 8)}.xlsx`);
  }
}