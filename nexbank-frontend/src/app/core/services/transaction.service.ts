import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/transactions`;

  getTransactions(): Observable<any> {
    return this.http.get(this.api);
  }

  transferFunds(data: any): Observable<any> {
    return this.http.post(`${this.api}/transfer`, data);
  }

  downloadStatement(data: { range: string; startDate?: string; endDate?: string }): Observable<Blob> {
    return this.http.post(`${this.api}/statement`, data, { responseType: 'blob' });
  }
}
