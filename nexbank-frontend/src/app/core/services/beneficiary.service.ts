import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class BeneficiaryService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/beneficiaries`;

  getBeneficiaries(): Observable<any> {
    return this.http.get(this.api);
  }

  addBeneficiary(data: any): Observable<any> {
    return this.http.post(this.api, data);
  }

  removeBeneficiary(id: string): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }
}
