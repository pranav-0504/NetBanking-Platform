import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/notifications`;

  getNotifications(): Observable<any> {
    return this.http.get(this.api);
  }

  markAllRead(): Observable<any> {
    return this.http.patch(`${this.api}/read`, {});
  }
}
