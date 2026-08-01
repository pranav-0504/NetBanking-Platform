import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private http = inject(HttpClient);

  // private api = 'http://localhost:4000/api/v1/auth';
  private api = `${environment.apiUrl}/auth`;

  register(data: any): Observable<any> {
    return this.http.post(`${this.api}/register`, data);
  }

  login(data: any): Observable<any> {
    return this.http.post(`${this.api}/login`, data);
  }

  refreshSession(refreshToken: string): Observable<any> {
    return this.http.post(`${this.api}/refresh`, { refreshToken });
  }

  logout(refreshToken: string | null): Observable<any> {
    return this.http.post(`${this.api}/logout`, { refreshToken });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.api}/change-password`, { currentPassword, newPassword });
  }

}
