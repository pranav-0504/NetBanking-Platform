import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/accounts`;

  getMyAccount(): Observable<any> {
    return this.http.get(`${this.api}/me`);
  }
}
