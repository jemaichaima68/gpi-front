import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TransferService, ConsultationHistoryDto } from '../../services/transfer.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  consultationHistory: ConsultationHistoryDto[] = [];
  filteredHistory: ConsultationHistoryDto[] = [];
  displayedHistory: ConsultationHistoryDto[] = [];
  isLoading = false;

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  filterDate = '';

  showConfirmModal = false;
  itemToDelete: ConsultationHistoryDto | null = null;
  deleteMode: 'single' | 'all' = 'single';

  constructor(
    private service: TransferService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoading = true;

    this.service.getConsultationHistory().subscribe({
      next: (res) => {
        this.consultationHistory = res;
        this.filteredHistory = [...res];
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.consultationHistory = [];
        this.filteredHistory = [];
        this.updateDisplayedItems();
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.consultationHistory];

    if (this.filterDate) {
      const selectedDate = new Date(this.filterDate);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      filtered = filtered.filter(item => {
        const itemDate = new Date(item.consultedAt);
        return itemDate >= startOfDay && itemDate <= endOfDay;
      });
    }

    this.filteredHistory = filtered;
    this.currentPage = 1;
    this.updateDisplayedItems();
  }

  resetFilters(): void {
    this.filterDate = '';
    this.filteredHistory = [...this.consultationHistory];
    this.currentPage = 1;
    this.updateDisplayedItems();
  }

  updateDisplayedItems(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.displayedHistory = this.filteredHistory.slice(start, end);
    this.totalPages = Math.max(1, Math.ceil(this.filteredHistory.length / this.itemsPerPage));
  }

  goToPage(page: number): void {
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
    const map: Record<string, string> = {
      'PDNG': 'En attente',
      'EN_ATTENTE': 'En attente',
      'ACCEPTE': 'Acceptée',
      'ACCP': 'Acceptée',
      'REJETE': 'Rejetée',
      'RJCT': 'Rejetée',
      'ANNULATION_EN_ATTENTE': 'Annulation en cours',
      'ANNULEE': 'Annulée'
    };

    return map[status] || status;
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      'PDNG': '⏳',
      'EN_ATTENTE': '⏳',
      'ACCEPTE': '✅',
      'ACCP': '✅',
      'REJETE': '❌',
      'RJCT': '❌',
      'ANNULATION_EN_ATTENTE': '🕓',
      'ANNULEE': '🚫'
    };

    return map[status] || '•';
  }

  getStatusClass(status: string): string {
    if (status === 'ACCEPTE' || status === 'ACCP') return 'status-accepted';
    if (status === 'REJETE' || status === 'RJCT') return 'status-rejected';
    if (status === 'ANNULATION_EN_ATTENTE') return 'status-cancel-pending';
    if (status === 'ANNULEE') return 'status-cancelled';
    return 'status-pending';
  }

  formatDateTime(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateOnly(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  viewDetails(item: ConsultationHistoryDto): void {
    if (item?.uetr) {
      this.router.navigate(['/client/tracking'], { queryParams: { uetr: item.uetr } });
    }
  }

  openDeleteConfirm(item: ConsultationHistoryDto): void {
    this.itemToDelete = item;
    this.deleteMode = 'single';
    this.showConfirmModal = true;
  }

  openDeleteAllConfirm(): void {
    if (this.filteredHistory.length === 0) {
      alert('Aucune consultation à supprimer');
      return;
    }

    this.itemToDelete = null;
    this.deleteMode = 'all';
    this.showConfirmModal = true;
  }

  closeModal(): void {
    this.showConfirmModal = false;
    this.itemToDelete = null;
  }

  confirmDelete(): void {
    if (this.deleteMode === 'single' && this.itemToDelete) {
      this.service.deleteConsultationHistory(this.itemToDelete.id).subscribe({
        next: () => {
          this.consultationHistory = this.consultationHistory.filter(h => h.id !== this.itemToDelete?.id);
          this.applyFilters();
          this.closeModal();
        },
        error: () => {
          alert('Erreur lors de la suppression');
        }
      });

      return;
    }

    if (this.deleteMode === 'all') {
      this.service.deleteAllConsultationHistory().subscribe({
        next: () => {
          this.consultationHistory = [];
          this.filteredHistory = [];
          this.updateDisplayedItems();
          this.closeModal();
        },
        error: () => {
          alert('Erreur lors de la suppression');
        }
      });
    }
  }
}
