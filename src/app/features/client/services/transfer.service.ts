import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// ==================== INTERFACES ====================

export interface ClientDashboardDto {
  totalTransactions: number;
  pendingTransactions: number;
  acceptedTransactions: number;
  rejectedTransactions: number;
  totalAmount: number;
  averageProcessingTimeHours: number;
  recentTransactions: RecentTransactionDto[];
  statusDistribution: Record<string, number>;
}

export interface RecentTransactionDto {
  id: number;
  uetr: string;
  amount: number;
  currency: string;
  status: string;
  debtorName: string;
  creditorName: string;
  creditorCountry: string;
  receivedAt: string;
}

export interface TransferResponse {
  id?: number;
  uetr: string;
  amount: number;
  currency: string;
  beneficiaryName: string;
  beneficiaryAccount: string;
  beneficiaryBank: string;
  senderName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  rejectionReason: string;
  timeline?: TimelineEventDto[];
  statusHistory?: TimelineEventDto[];
}

export interface TimelineEventDto {
  status: string;
  label: string;
  description: string;
  details: string;
  timestamp: string;
  location: string;
}

export interface ConsultationHistory {
  id: number;
  uetr: string;
  consultedAt: string;
  status: string;
  amount: number;
  currency: string;
  updatedAt: string;
}

export interface ClientNotification {
  id: number;
  title: string;
  message: string;
  date: string;
  createdAt: string;
  type: string;
  read: boolean;
  uetr: string;
}

// ==================== SERVICE ====================

@Injectable({ providedIn: 'root' })
export class TransferService {
  
  private apiUrl = 'http://localhost:8081/api/client';
  
  constructor(private http: HttpClient) {}
  
  getDashboard(): Observable<ClientDashboardDto> {
    return this.http.get<ClientDashboardDto>(`${this.apiUrl}/dashboard`);
  }
  
  getTransactions(): Observable<TransferResponse[]> {
    return this.http.get<TransferResponse[]>(`${this.apiUrl}/transactions`);
  }
  
  getTransferByUetr(uetr: string): Observable<TransferResponse> {
    return this.http.get<TransferResponse>(`${this.apiUrl}/transfers/${uetr}`);
  }
  
  getTransactionTimeline(id: number): Observable<TimelineEventDto[]> {
    return this.http.get<TimelineEventDto[]>(`${this.apiUrl}/transactions/${id}/timeline`);
  }
  
  getConsultationHistory(): Observable<ConsultationHistory[]> {
    return this.http.get<ConsultationHistory[]>(`${this.apiUrl}/history`);
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
  // Récupérer une transaction par ID
getTransactionDetails(id: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/transactions/${id}`);
}

// Exporter le XML d'une transaction
exportTransactionXml(id: number): Observable<Blob> {
  return this.http.get(`${this.apiUrl}/transactions/${id}/xml`, { responseType: 'blob' });
}
}