import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../environments/environment.development';
import { SessionService } from '../../core/services/session.service';

@Component({ selector: 'app-admin-dashboard', imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatIconModule], templateUrl: './admin-dashboard.component.html', styleUrl: './admin-dashboard.component.scss' })
export class AdminDashboardComponent implements OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  private session = inject(SessionService);
  loading = true;
  error = '';
  data: any;
  operations: any = { users: [], accounts: [], transactions: [] };
  refreshing = false;
  clearingId = '';
  deletingId = '';
  deleteTarget: { id: string; name: string } | null = null;
  deletedUserName = '';
  liveRefresh = true;
  private refreshTimer?: number;

  constructor() { this.load(); this.refreshTimer = window.setInterval(() => { if (this.liveRefresh) this.refresh(); }, 30000); }
  ngOnDestroy() { if (this.refreshTimer) window.clearInterval(this.refreshTimer); }
  load() { this.loading = true; this.error = ''; this.http.get<any>(`${environment.apiUrl}/admin/overview`).subscribe({ next: (res) => { this.data = res.data; this.loadOperations(); this.loading = false; }, error: (err) => { this.error = err?.error?.message || 'Unable to load administrator data.'; this.loading = false; } }); }
  refresh() { if (this.refreshing) return; this.refreshing = true; this.http.get<any>(`${environment.apiUrl}/admin/overview`).subscribe({ next: (res) => { this.data = res.data; this.loadOperations(() => this.refreshing = false); }, error: () => this.refreshing = false }); }
  loadOperations(done?: () => void) { this.http.get<any>(`${environment.apiUrl}/admin/operations`).subscribe({ next: (res) => { this.operations = res.data; done?.(); }, error: () => done?.() }); }
  clearTransaction(id: string) { if (this.clearingId) return; this.clearingId = id; this.http.post(`${environment.apiUrl}/admin/transactions/${id}/clear`, {}).subscribe({ next: () => { this.clearingId = ''; this.refresh(); }, error: (err) => { this.clearingId = ''; this.error = err?.error?.message || 'Unable to clear transaction.'; } }); }
  requestUserDeletion(id: string, name: string) { if (!this.deletingId) this.deleteTarget = { id, name }; }
  cancelUserDeletion() { this.deleteTarget = null; }
  confirmUserDeletion() {
    if (!this.deleteTarget || this.deletingId) return;
    const target = this.deleteTarget;
    this.deletingId = target.id;
    this.http.delete(`${environment.apiUrl}/admin/users/${target.id}`).subscribe({ next: () => { this.deletingId = ''; this.deleteTarget = null; this.deletedUserName = target.name; this.refresh(); }, error: (err) => { this.deletingId = ''; this.deleteTarget = null; this.error = err?.error?.message || 'Unable to delete user.'; } });
  }
  closeSuccessModal() { this.deletedUserName = ''; }
  logout() { this.session.logout(); }
  formatName(user: any) { return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : '-'; }
}
