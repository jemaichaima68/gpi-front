import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AppUser {
  id:               string;
  keycloakId:       string;
  username:         string;
  email:            string;
  firstName:        string;
  lastName:         string;
  role:             string;
  actif:            number;
  dateCreation:     string | null;
  dateModification: string | null;
}

export interface UserCreateRequest {
  username:  string;
  email:     string;
  firstName: string;
  lastName:  string;
  role:      string;
  password:  string;
}

export interface DashboardStats {
  totalUsers:           number;
  activeUsers:          number;
  inactiveUsers:        number;
  addedThisMonth:       number;
  byRole:               Record<string, number>;
  recentUsers:          AppUser[];
  registrationsByMonth: Record<string, number>;
}

export interface ActivityLog {
  id:          string;
  action:      string;
  entityType:  string;
  entityId:    string;
  description: string;
  performedBy: string;
  dateAction:  string;
}

@Injectable({ providedIn: 'root' })
export class UserService {

  private readonly BASE = `${environment.apiUrl}/api/admin`;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.BASE}/dashboard/stats`);
  }

  getAllUsers(): Observable<AppUser[]> {
    return this.http.get<AppUser[]>(`${this.BASE}/users`);
  }

  getUserById(id: string): Observable<AppUser> {
    return this.http.get<AppUser>(`${this.BASE}/users/${id}`);
  }

  getUsersByRole(role: string): Observable<AppUser[]> {
    return this.http.get<AppUser[]>(`${this.BASE}/users/role/${role}`);
  }

  createUser(payload: UserCreateRequest): Observable<AppUser> {
    return this.http.post<AppUser>(`${this.BASE}/users`, payload);
  }

  updateUser(id: string, payload: Partial<AppUser>): Observable<AppUser> {
    return this.http.put<AppUser>(`${this.BASE}/users/${id}`, payload);
  }

  toggleStatus(id: string): Observable<AppUser> {
    return this.http.patch<AppUser>(`${this.BASE}/users/${id}/toggle`, {});
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/users/${id}`);
  }

  getLogs(): Observable<ActivityLog[]> {
    return this.http.get<ActivityLog[]>(`${this.BASE}/logs`);
  }
}