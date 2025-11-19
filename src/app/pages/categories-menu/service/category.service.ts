import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@/pages/commons/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CategoryService {
    constructor(private http: HttpClient) {}

    private apiUrlCategoriesByTenant = `${environment.apiUrl}/tenant-menu-categories/categories`;
    private apiUrlCreateCategory = `${environment.apiUrl}/tenant-menu-categories`;
    private apiUrlDeleteCategory = `${environment.apiUrl}/tenant-menu-categories`;

    getCategoriesByTenantId(tenantId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrlCategoriesByTenant}/${tenantId}`);
    }

    createCategory(payload: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrlCreateCategory}`, payload);
    }

    updateCategory(categoryId: number, payload: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrlCreateCategory}/${categoryId}`, payload);
    }

    deleteCategoryById(categoryId: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrlDeleteCategory}/${categoryId}`);
    }
}
