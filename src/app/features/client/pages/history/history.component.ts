import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { TransferService } from '../../services/transfer.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  consultationHistory: any[] = [];
  filteredHistory: any[] = [];
  displayedHistory: any[] = [];
  isLoading: boolean = true;
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  
  // Filtres
  filterDateDebut: string = '';
  filterDateFin: string = '';
  
  // Modal confirmation
  showConfirmModal: boolean = false;
  itemToDelete: any = null;
  deleteMode: 'single' | 'all' = 'single';

  constructor(
    private service: TransferService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.isLoading = true;
    this.service.getConsultationHistory().subscribe({
      next: (res) => {
        console.log('Historique reçu:', res);
        this.consultationHistory = res;
        this.filteredHistory = [...res];
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        // Données mockées pour test
        this.setMockData();
        this.isLoading = false;
      }
    });
  }

  setMockData() {
    this.consultationHistory = [
      { id: 1, uetr: '70e3cf7a-7af0-48d9-856f-a5affa6b38de', consultedAt: new Date().toISOString(), status: 'ACSC', amount: 1250, currency: 'EUR' },
      { id: 2, uetr: '97ed4827-7b6f-4491-a06f-b548d5a7512d', consultedAt: new Date(Date.now() - 86400000).toISOString(), status: 'PDNG', amount: 3500, currency: 'EUR' },
      { id: 3, uetr: 'GPI584230-xxxx-xxxx-xxxx-xxxxxxxxxxxx', consultedAt: new Date(Date.now() - 172800000).toISOString(), status: 'ACSC', amount: 860, currency: 'EUR' }
    ];
    this.filteredHistory = [...this.consultationHistory];
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.consultationHistory];
    
    if (this.filterDateDebut) {
      const startDate = new Date(this.filterDateDebut);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.consultedAt);
        return itemDate >= startDate;
      });
    }
    
    if (this.filterDateFin) {
      const endDate = new Date(this.filterDateFin);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.consultedAt);
        return itemDate <= endDate;
      });
    }
    
    this.filteredHistory = filtered;
    this.currentPage = 1;
    this.updateDisplayedItems();
  }

  resetFilters() {
    this.filterDateDebut = '';
    this.filterDateFin = '';
    this.filteredHistory = [...this.consultationHistory];
    this.currentPage = 1;
    this.updateDisplayedItems();
  }

  updateDisplayedItems() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.displayedHistory = this.filteredHistory.slice(start, end);
    this.totalPages = Math.ceil(this.filteredHistory.length / this.itemsPerPage);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedItems();
    }
  }

  getPages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getStatusLabel(status: string): string {
    const map: any = { 'PDNG': 'En attente', 'ACSC': 'Finalisé', 'RJCT': 'Rejeté' };
    return map[status] || status;
  }

  formatDateTime(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleString('fr-FR');
  }


  // ========== SUPPRESSION AVEC CONFIRMATION ==========
  
  openDeleteConfirm(item: any) {
    this.itemToDelete = item;
    this.deleteMode = 'single';
    this.showConfirmModal = true;
  }

  openDeleteAllConfirm() {
    if (this.filteredHistory.length === 0) {
      alert('Aucune consultation à supprimer');
      return;
    }
    this.itemToDelete = null;
    this.deleteMode = 'all';
    this.showConfirmModal = true;
  }

  closeModal() {
    this.showConfirmModal = false;
    this.itemToDelete = null;
  }

  confirmDelete() {
    if (this.deleteMode === 'single' && this.itemToDelete) {
      // Suppression d'une consultation
      this.service.deleteConsultationHistory(this.itemToDelete.id).subscribe({
        next: (res) => {
          console.log('Succès suppression:', res);
          alert('✅ Consultation supprimée avec succès !');
          this.consultationHistory = this.consultationHistory.filter(h => h.id !== this.itemToDelete.id);
          this.applyFilters();
          this.closeModal();
        },
        error: (err) => {
          console.error('Erreur suppression:', err);
          
          // Fallback: suppression locale si backend non disponible
          if (err.status === 404 || err.status === 0) {
            alert('⚠️ Suppression effectuée localement (backend non disponible)');
            this.consultationHistory = this.consultationHistory.filter(h => h.id !== this.itemToDelete.id);
            this.applyFilters();
            this.closeModal();
          } else {
            alert('❌ Erreur lors de la suppression: ' + (err.error?.message || err.message));
          }
        }
      });
    } else if (this.deleteMode === 'all') {
      // Suppression de toutes les consultations
      this.service.deleteAllConsultationHistory().subscribe({
        next: (res) => {
          console.log('Succès suppression totale:', res);
          alert('✅ Toutes les consultations ont été supprimées avec succès !');
          this.consultationHistory = [];
          this.filteredHistory = [];
          this.updateDisplayedItems();
          this.closeModal();
        },
        error: (err) => {
          console.error('Erreur suppression totale:', err);
          
          // Fallback: suppression locale si backend non disponible
          if (err.status === 404 || err.status === 0) {
            alert('⚠️ Suppression effectuée localement (backend non disponible)');
            this.consultationHistory = [];
            this.filteredHistory = [];
            this.updateDisplayedItems();
            this.closeModal();
          } else {
            alert('❌ Erreur lors de la suppression: ' + (err.error?.message || err.message));
          }
        }
      });
    }
  }

  // ========== EXPORTS ==========
  exportPdf() {
    if (this.filteredHistory.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.setTextColor(102, 126, 234);
    doc.text('Historique des consultations', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Exporté le: ${new Date().toLocaleString('fr-FR')}`, pageWidth - 20, 30, { align: 'right' });
    doc.text(`Total: ${this.filteredHistory.length} consultation(s)`, 14, 40);
    
    const tableData = this.filteredHistory.map(item => [
      item.uetr,
      this.getStatusLabel(item.status),
      this.formatDateTime(item.consultedAt),
      `${item.amount || '-'} ${item.currency || 'EUR'}`
    ]);
    
    autoTable(doc, {
      startY: 45,
      head: [['UETR', 'Statut', 'Date consultation', 'Montant']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [102, 126, 234], textColor: 255 },
      margin: { left: 14, right: 14 }
    });
    
    doc.save(`historique_consultations_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  exportExcel() {
    if (this.filteredHistory.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const data = this.filteredHistory.map(item => ({
      UETR: item.uetr,
      Statut: this.getStatusLabel(item.status),
      'Date consultation': this.formatDateTime(item.consultedAt),
      Montant: `${item.amount || '-'} ${item.currency || 'EUR'}`
    }));
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Historique');
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `historique_consultations_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
  viewDetails(item: any) {
  if (item.id) {
    this.router.navigate(['/client/transaction', item.id]);
  } else if (item.uetr) {
    this.router.navigate(['/client/transaction/uetr', item.uetr]);
  }
}
  
}