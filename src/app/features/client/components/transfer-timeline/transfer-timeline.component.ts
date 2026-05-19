// transfer-timeline.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TrackingStep {
  code: string;
  label: string;
  description: string;
  icon: string;
  status: 'completed' | 'current' | 'pending' | 'rejected';
  date?: string;
  location?: string;
}

@Component({
  selector: 'app-transfer-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tracking-container">
      
      <!-- En-tête -->
      <div class="tracking-header">
        <div class="tracking-title">
          <span class="title-icon">📍</span>
          <h3>Suivi de votre transfert SWIFT</h3>
        </div>
        <div class="tracking-ref" *ngIf="uetr">
          <span class="ref-label">UETR:</span>
          <code class="ref-code">{{ uetr | slice:0:8 }}...{{ uetr | slice:-8 }}</code>
        </div>
      </div>

      <!-- Timeline -->
      <div class="timeline-progress">
        <div class="steps-container">
          <div *ngFor="let step of steps; let i = index" class="step-wrapper">
            
            <div class="step-item" 
                 [class.completed]="step.status === 'completed'"
                 [class.current]="step.status === 'current'"
                 [class.pending]="step.status === 'pending'"
                 [class.rejected]="step.status === 'rejected'">
              
              <div class="step-icon">
                <div class="icon-circle">
                  <span *ngIf="step.status === 'completed'">✓</span>
                  <span *ngIf="step.status === 'current' && step.code !== 'RJCT'">
                    <span class="spinner"></span>
                  </span>
                  <span *ngIf="step.status === 'pending'">{{ i + 1 }}</span>
                  <span *ngIf="step.status === 'rejected'">✗</span>
                </div>
              </div>

              <div class="step-content">
                <div class="step-header">
                  <span class="step-label">{{ step.label }}</span>
                  <span class="step-date" *ngIf="step.date">{{ step.date }}</span>
                </div>
                <p class="step-description">{{ step.description }}</p>
                <div class="step-location" *ngIf="step.location">
                  <span class="location-icon">🏦</span>
                  <span>{{ step.location }}</span>
                </div>
              </div>
            </div>

            <div *ngIf="i < steps.length - 1" class="step-connector" 
                 [class.completed]="step.status === 'completed'"></div>
          </div>
        </div>
      </div>

      <!-- Message final -->
      <div class="current-status" [class]="currentStep?.status">
        <div class="status-badge">
          <span class="status-icon">{{ getCurrentStatusIcon() }}</span>
          <span class="status-text">{{ getCurrentStatusMessage() }}</span>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .tracking-container {
      background: white;
      border-radius: 24px;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      margin-top: 20px;
    }
    .tracking-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      flex-wrap: wrap;
      gap: 16px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f1f5f9;
    }
    .tracking-title { display: flex; align-items: center; gap: 10px; }
    .title-icon { font-size: 24px; }
    .tracking-title h3 { margin: 0; font-size: 18px; font-weight: 700; color: #1e293b; }
    .tracking-ref { background: #f8fafc; padding: 8px 16px; border-radius: 40px; font-size: 12px; }
    .ref-label { color: #64748b; margin-right: 8px; }
    .ref-code { font-family: monospace; color: #667eea; font-weight: 600; }
    .timeline-progress { padding: 8px 0 24px 0; }
    .steps-container { display: flex; flex-direction: column; position: relative; }
    .step-wrapper { display: flex; flex-direction: column; position: relative; }
    .step-item { display: flex; gap: 20px; position: relative; z-index: 2; }
    .step-icon { flex-shrink: 0; width: 48px; display: flex; justify-content: center; }
    .icon-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 700;
      transition: all 0.3s;
    }
    .step-item.completed .icon-circle { background: #10b981; color: white; box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
    .step-item.current .icon-circle { background: #667eea; color: white; box-shadow: 0 4px 12px rgba(102,126,234,0.4); animation: pulse 2s infinite; }
    .step-item.pending .icon-circle { background: #f1f5f9; color: #94a3b8; border: 2px solid #e2e8f0; }
    .step-item.rejected .icon-circle { background: #ef4444; color: white; box-shadow: 0 4px 12px rgba(239,68,68,0.3); }
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    .step-content { flex: 1; padding-bottom: 24px; }
    .step-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 6px; }
    .step-label { font-weight: 700; font-size: 15px; }
    .step-item.completed .step-label { color: #10b981; }
    .step-item.current .step-label { color: #667eea; }
    .step-item.pending .step-label { color: #94a3b8; }
    .step-item.rejected .step-label { color: #ef4444; }
    .step-date { font-size: 11px; color: #94a3b8; }
    .step-description { font-size: 13px; color: #475569; margin: 4px 0 6px 0; }
    .step-location { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #667eea; background: #f0f4ff; padding: 4px 12px; border-radius: 20px; }
    .location-icon { font-size: 12px; }
    .step-connector { width: 2px; height: 40px; background: #e2e8f0; margin-left: 20px; }
    .step-connector.completed { background: #10b981; }
    .current-status { margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
    .status-badge { display: inline-flex; align-items: center; gap: 10px; padding: 12px 24px; border-radius: 50px; font-weight: 600; }
    .current-status.completed .status-badge { background: #d1fae5; color: #059669; }
    .current-status.current .status-badge { background: #e0e7ff; color: #4338ca; }
    .current-status.pending .status-badge { background: #fef3c7; color: #d97706; }
    .current-status.rejected .status-badge { background: #fee2e2; color: #dc2626; }
    .status-icon { font-size: 20px; }
    .status-text { font-size: 14px; }
    @media (max-width: 640px) {
      .tracking-container { padding: 16px; }
      .step-item { gap: 12px; }
      .step-icon { width: 36px; }
      .icon-circle { width: 32px; height: 32px; font-size: 14px; }
      .step-label { font-size: 13px; }
      .step-description { font-size: 11px; }
    }
  `]
})
export class TransferTimelineComponent implements OnInit {
  @Input() currentStatus: string = 'PDNG';
  @Input() uetr: string = '';
  
  steps: TrackingStep[] = [];

  ngOnInit() {
    this.buildTimeline();
  }

  get currentStep(): TrackingStep | undefined {
    return this.steps.find(s => s.status === 'current');
  }

  buildTimeline() {
    // Si rejeté
    if (this.currentStatus === 'RJCT' || this.currentStatus === 'REJETE') {
      this.steps = [
        {
          code: 'PDNG',
          label: ' En attente de validation',
          description: 'Votre transaction a été reçue',
          icon: '⏳',
          status: 'completed'
        },
        {
          code: 'RJCT',
          label: '❌ Transaction rejetée',
          description: 'Votre transfert n\'a pas pu être validé',
          icon: '🚫',
          status: 'current'
        }
      ];
      return;
    }

    // Étapes normales
    const allSteps: TrackingStep[] = [
      {
        code: 'PDNG',
        label: ' En attente de validation',
        description: 'Votre transaction a été reçue et est en cours d\'analyse',
        icon: '⏳',
        status: 'pending'
      },
      {
        code: 'ACTC',
        label: ' Validation technique',
        description: 'La transaction a passé les vérifications techniques',
        icon: '🔧',
        status: 'pending'
      },
      {
        code: 'ACSP',
        label: ' En traitement SWIFT',
        description: 'Le virement est en cours d\'acheminement sur le réseau SWIFT',
        icon: '🌐',
        status: 'pending'
      },
      {
        code: 'ACSC',
        label: ' Finalisé',
        description: 'Transfert terminé. Les fonds ont été crédités',
        icon: '✅',
        status: 'pending'
      }
    ];

    const statusOrder = ['PDNG', 'ACTC', 'ACSP', 'ACSC'];
    const currentIndex = statusOrder.indexOf(this.currentStatus);
    
    this.steps = allSteps.map((step, index) => {
      if (index < currentIndex) {
        return { ...step, status: 'completed' as const };
      } else if (index === currentIndex) {
        return { ...step, status: 'current' as const };
      } else {
        return { ...step, status: 'pending' as const };
      }
    });
  }

  getCurrentStatusIcon(): string {
    const icons: Record<string, string> = {
      'ACSC': '✅', 'RJCT': '❌', 'ACTC': '🔧', 'ACSP': '🔄'
    };
    return icons[this.currentStatus] || '⏳';
  }

  getCurrentStatusMessage(): string {
    const messages: Record<string, string> = {
      'PDNG': 'Votre transfert est en cours de vérification',
      'ACTC': 'Validation technique réussie',
      'ACSP': 'Votre transfert est en cours d\'acheminement',
      'ACSC': 'Transfert finalisé avec succès !',
      'RJCT': 'Transfert non validé'
    };
    return messages[this.currentStatus] || 'Mise à jour en cours';
  }
}