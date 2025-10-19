import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tenant } from '../../model/tenat.component';
import { environment } from '@/pages/commons/environment';

@Injectable({providedIn: 'root'})
export class TenantService {


  private apiUrl = `${environment.apiUrl}/tenant`;
  private apiUrlGetByEmail = `${environment.apiUrl}/tenant/config`;

  constructor(private http: HttpClient) {}

  createTenant(tenant: Tenant): Observable<any> {
    return this.http.post<any>(this.apiUrl, tenant);
  }

  getTenantByEmail(email: string) {
      return this.http.get<Tenant>(`${this.apiUrlGetByEmail}/${email}`);
  }
}
