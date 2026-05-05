import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

// Interface locale pour la timeline
export interface TimelineEventDto {
  status: string;
  label: string;
  description: string;
  details: string;
  timestamp: string;
  location: string;
}

@Component({
  selector: 'app-transfer-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="timeline-container">
      <div *ngIf="events.length === 0" class="empty-timeline">
        Aucun événement disponible
      </div>
      
      <div class="timeline" *ngIf="events.length > 0">
        <div *ngFor="let event of events; let i = index" class="timeline-item">
          <div class="timeline-marker" [class.completed]="event.status !== 'PDNG'">
            <div class="marker-dot"></div>
            <div *ngIf="i < events.length - 1" class="marker-line"></div>
          </div>
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="timeline-status" [class]="event.status | lowercase">
                {{ event.label || event.status }}
              </span>
              <span class="timeline-date">{{ event.timestamp | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="timeline-description">{{ event.description }}</div>
            <div class="timeline-details" *ngIf="event.details">{{ event.details }}</div>
            <div class="timeline-location" *ngIf="event.location">📍 {{ event.location }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .timeline-container {
      padding: 8px 0;
    }
    .empty-timeline {
      text-align: center;
      padding: 40px;
      color: #94a3b8;
    }
    .timeline {
      position: relative;
    }
    .timeline-item {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }
    .timeline-marker {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 30px;
      flex-shrink: 0;
    }
    .marker-dot {
      width: 12px;
      height: 12px;
      background: #cbd5e1;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 0 2px #cbd5e1;
      z-index: 2;
    }
    .timeline-item:first-child .marker-dot {
      background: #667eea;
      box-shadow: 0 0 0 2px #667eea;
    }
    .marker-line {
      flex: 1;
      width: 2px;
      background: #e2e8f0;
      margin-top: 4px;
      min-height: 40px;
    }
    .timeline-content {
      flex: 1;
      padding-bottom: 8px;
    }
    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .timeline-status {
      font-weight: 700;
      font-size: 14px;
    }
    .timeline-status.pdng { color: #d97706; }
    .timeline-status.actc { color: #2563eb; }
    .timeline-status.acsp { color: #059669; }
    .timeline-status.acsc { color: #059669; }
    .timeline-status.rjct { color: #dc2626; }
    .timeline-date {
      font-size: 11px;
      color: #94a3b8;
    }
    .timeline-description {
      font-size: 13px;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .timeline-details {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }
    .timeline-location {
      font-size: 11px;
      color: #667eea;
      margin-top: 4px;
    }
  `]
})
export class TransferTimelineComponent {
  @Input() events: TimelineEventDto[] = [];
}