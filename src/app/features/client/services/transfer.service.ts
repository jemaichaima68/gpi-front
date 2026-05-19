import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface TransferResponse {
  id?: number;
  uetr: string;
  amount: number;
  currency: string;
  beneficiaryName: string;
  beneficiaryAccount?: string;
  beneficiaryBank?: string;
  senderName?: string;
  debtorName?: string;
  creditorName?: string;
  creditorAgentBic?: string;
  debtorCountry?: string;
  creditorCountry?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
  alerte?: string;
  motifAlerte?: string;
  bankJourney?: BankJourney[];
  totalFees?: number;
  netAmount?: number;
  timeline?: TransactionTimelineDto[];
  statusHistory?: any[];
}

export interface BankJourney {
  step: number;
  bankName: string;
  bankBic: string;
  role: string;
  fees: string;
  status: string;
  timestamp: string;
}

export interface ClientDashboardDto {
  totalTransactions: number;
  pendingTransactions: number;
  acceptedTransactions: number;
  rejectedTransactions: number;
  totalAmount: number;
  averageProcessingTimeHours?: number;
  recentTransactions: RecentTransactionDto[];
  statusDistribution: Record<string, number>;
}

export interface RecentTransactionDto {
  id: number;
  msgId?: string;
  uetr: string;
  amount: number;
  currency: string;
  debtorName?: string;
  creditorName?: string;
  creditorCountry?: string;
  debtorCountry?: string;
  status: string;
  receivedAt: Date;
  alerte?: string;
  motifAlerte?: string;
  messageType?: string;
  agentValidated?: boolean;
  rejectionReason?: string;
}

export interface ClientNotification {
  id: number;
  title: string;
  message: string;
  date?: string;
  createdAt?: string;
  type: string;
  read: boolean;
  uetr: string;
}

export interface ConsultationHistoryDto {
  id: number;
  uetr: string;
  consultedAt: string;
  status: string;
  amount: number;
  currency: string;
  updatedAt: string;
}

export interface TransactionTimelineDto {
  status: string;
  statusLabel: string;
  description: string;
  timestamp: string;
  completed: boolean;
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransferService {
  private apiUrl = `${environment.apiUrl}/api/client`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<ClientDashboardDto> {
    return this.http.get<ClientDashboardDto>(`${this.apiUrl}/dashboard`);
  }

  getClientDashboardData(): Observable<ClientDashboardDto> {
    return this.http.get<ClientDashboardDto>(`${this.apiUrl}/dashboard/client`);
  }

  getTransferByUetr(uetr: string): Observable<TransferResponse> {
    return this.http.get<TransferResponse>(`${this.apiUrl}/transfers/${uetr}`);
  }

  getTransactionDetails(id: number): Observable<TransferResponse> {
    return this.http.get<TransferResponse>(`${this.apiUrl}/transactions/${id}`);
  }

  getTransactionTimeline(id: number): Observable<TransactionTimelineDto[]> {
    return this.http.get<TransactionTimelineDto[]>(`${this.apiUrl}/transactions/${id}/timeline`);
  }

  getRejectionReason(id: number): Observable<{ rejectionReason: string }> {
    return this.http.get<{ rejectionReason: string }>(`${this.apiUrl}/transactions/${id}/rejection-reason`);
  }

  getConsultationHistory(): Observable<ConsultationHistoryDto[]> {
    return this.http.get<ConsultationHistoryDto[]>(`${this.apiUrl}/history`);
  }

  deleteConsultationHistory(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/history/${id}`);
  }

  deleteAllConsultationHistory(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/history`);
  }

  getNotifications(): Observable<ClientNotification[]> {
    return this.http.get<ClientNotification[]>(`${this.apiUrl}/notifications`);
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/notifications/unread-count`);
  }

  markNotificationRead(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/notifications/${id}/read`, {});
  }

  markAllNotificationsAsRead(): Observable<any> {
    return this.http.post(`${this.apiUrl}/notifications/read-all`, {});
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, data);
  }
}
