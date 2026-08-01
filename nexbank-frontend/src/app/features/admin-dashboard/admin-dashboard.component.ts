import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../environments/environment.development';
import { SessionService } from '../../core/services/session.service';

@Component({ selector: 'app-admin-dashboard', imports: [CommonModule, MatButtonModule, MatIconModule], templateUrl: './admin-dashboard.component.html', styleUrl: './admin-dashboard.component.scss' })
export class AdminDashboardComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private session = inject(SessionService);
  loading = true;
  error = '';
  data: any;

  constructor() { this.load(); }
  load() { this.loading = true; this.error = ''; this.http.get<any>(`${environment.apiUrl}/admin/overview`).subscribe({ next: (res) => { this.data = res.data; this.loading = false; }, error: (err) => { this.error = err?.error?.message || 'Unable to load administrator data.'; this.loading = false; } }); }
  logout() { this.session.logout(); }
  formatName(user: any) { return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : '-'; }
}
