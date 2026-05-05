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
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    CardModule, 
    ToastModule, 
    TagModule, 
    TooltipModule,
    DialogModule
  ],
  providers: [MessageService],
  templateUrl: './transaction-detail.component.html',
  styleUrls: ['./transaction-detail.component.css']
})
export class TransactionDetailComponent implements OnInit {
  
  transaction: any = null;
  error: string = '';
  loading: boolean = true;
  
  // Variables pour le dialogue XML
  showXmlDialog: boolean = false;
  rawXmlContent: string = '';
  
  get formattedXmlContent(): string {
    return this.beautifyXml(this.rawXmlContent);
  }

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
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
    this.cdr.detectChanges();
    
    this.http.get(`${environment.apiUrl}/api/agent/messages/${id}`)
      .subscribe({
        next: (data: any) => {
          this.transaction = data;
          console.log('=== DÉTAIL TRANSACTION ===');
          console.log('Statut reçu:', data.status);
          console.log('Type de statut:', typeof data.status);
          console.log('Transaction complète:', data);
          console.log('needsAgentAction?', this.needsAgentAction(data.status));
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          const errorMsg = err.error?.message || "Impossible de charger la transaction";
          this.error = errorMsg;
          this.loading = false;
          this.cdr.detectChanges();
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Erreur', 
            detail: errorMsg
          });
        }
      });
  }

  /**
   * Formate le XML avec une indentation propre
   */
  private beautifyXml(xml: string): string {
    if (!xml) return '';
    
    let formatted = xml.trim();
    formatted = formatted.replace(/>/g, '>\n');
    formatted = formatted.replace(/</g, '\n<');
    
    let lines = formatted.split('\n');
    let result: string[] = [];
    let indentLevel = 0;
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (line.length === 0) continue;
      
      if (line.match(/^<\/[^>]+>$/)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      let indentation = '  '.repeat(indentLevel);
      result.push(indentation + line);
      
      if (line.match(/^<[^?!/][^>]*[^/]>$/) && !line.match(/<[^>]*\/>/)) {
        indentLevel++;
      }
    }
    
    return result.join('\n');
  }

  downloadXmlFile() {
    if (!this.transaction || !this.transaction.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Non disponible',
        detail: 'Aucun fichier XML associé à cette transaction'
      });
      return;
    }

    this.http.get(`${environment.apiUrl}/api/agent/messages/${this.transaction.id}/download-xml`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.transaction.fileName || `transaction_${this.transaction.id}.xml`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Téléchargement réussi',
          detail: `Fichier ${this.transaction.fileName || 'XML'} téléchargé`
        });
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de récupérer le fichier XML'
        });
      }
    });
  }

  viewXmlContent() {
    if (!this.transaction || !this.transaction.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Non disponible',
        detail: 'Aucun fichier XML associé à cette transaction'
      });
      return;
    }

    this.http.get(`${environment.apiUrl}/api/agent/messages/${this.transaction.id}/xml`, {
      responseType: 'text'
    }).subscribe({
      next: (xmlData: string) => {
        this.rawXmlContent = xmlData;
        this.showXmlDialog = true;
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger le contenu XML'
        });
      }
    });
  }

  copyXmlToClipboard() {
    if (this.rawXmlContent) {
      navigator.clipboard.writeText(this.rawXmlContent);
      this.messageService.add({
        severity: 'success',
        summary: 'Copié !',
        detail: 'Le contenu XML a été copié dans le presse-papier'
      });
    }
  }

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
        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible d\'accepter'
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
        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de rejeter'
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
    // Version améliorée avec plus de cas
    if (!status) return false;
    
    const statusNormalized = status.toUpperCase();
    
    return statusNormalized === 'EN_ATTENTE' || 
           statusNormalized === 'SIGNALE' || 
           statusNormalized === 'PDNG' ||
           statusNormalized.includes('PDNG') ||
           statusNormalized.includes('EN_ATTENTE');
  }

  getStatusSeverity(status: string): "success" | "danger" | "warn" | "secondary" | "info" {
    const statusNormalized = status?.toUpperCase() || '';
    
    switch (statusNormalized) {
      case 'ACCEPTE':
      case 'ACCP':
        return 'success';
      case 'REJETE':
      case 'RJCT':
        return 'danger';
      case 'EN_ATTENTE':
      case 'PDNG':
        return 'warn';
      case 'SIGNALE':
        return 'info';
      default:
        return 'secondary';
    }
  }

  getStatusLabel(status: string): string {
    const statusNormalized = status?.toUpperCase() || '';
    
    switch (statusNormalized) {
      case 'EN_ATTENTE':
        return 'PDNG (En attente)';
      case 'PDNG':
        return 'PDNG (En attente)';
      case 'ACCEPTE':
      case 'ACCP':
        return 'ACCP (Accepté)';
      case 'REJETE':
      case 'RJCT':
        return 'RJCT (Rejeté)';
      case 'ACTC':
        return 'ACTC (Validé techniquement)';
      case 'ACSP':
        return 'ACSP (En cours de règlement)';
      case 'SIGNALE':
        return 'PDNG (Signalé)';
      default:
        return status || '—';
    }
  }

  getStatusTooltip(status: string): string {
    const statusNormalized = status?.toUpperCase() || '';
    
    switch (statusNormalized) {
      case 'EN_ATTENTE':
      case 'PDNG':
        return 'PDNG - En attente de traitement';
      case 'ACCEPTE':
      case 'ACCP':
        return 'ACCP - Transaction acceptée par la banque';
      case 'REJETE':
      case 'RJCT':
        return 'RJCT - Transaction rejetée';
      case 'ACTC':
        return 'ACTC - Transaction validée techniquement';
      case 'ACSP':
        return 'ACSP - En cours de règlement';
      case 'SIGNALE':
        return 'PDNG - Transaction signalée, nécessite une attention';
      default:
        return status || '';
    }
  }

  getAlerteLabel(alerte: string): string {
    switch (alerte) {
      case 'OK': return '✓ Transaction conforme';
      case 'ATTENTION': return '⚠️ Alerte - À vérifier';
      case 'GRAVE': return '🔴 Alerte critique - Bloquer';
      default: return alerte || '—';
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