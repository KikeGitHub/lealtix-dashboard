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
    private apiUrlReorderCategories = `${environment.apiUrl}/tenant-menu-categories/tenant`;

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

    reorderCategories(categories: Array<{ id: number; displayOrder: number }>, tenantId: number): Observable<any> {
        // Backend expects an object with a `categories` array: { categories: [ { id, displayOrder } ] }
        const body = { categories };
        return this.http.put<any>(`${this.apiUrlReorderCategories}/${tenantId}/reorder`, body);
    }

    checkCategoriesExist(tenantId: number): Observable<boolean> {
        return new Observable<boolean>((observer) => {
            this.getCategoriesByTenantId(tenantId).subscribe({
                next: (data) => {
                    // Check if the response code is 200 and has categories
                    const hasCategories = data.code === 200 && data.object && data.object.length > 0;
                    observer.next(hasCategories);
                    observer.complete();
                },
                error: (err) => {
                    // If 404 or any error, assume no categories exist
                    observer.next(false);
                    observer.complete();
                }
            });
        });
    }
}
