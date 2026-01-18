import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@/pages/commons/environment';
import { TreeNode } from 'primeng/api';

/**
 * Category with products structure for reward selection
 */
export interface CatalogProduct {
  id: number;
  name: string;
  price?: number;
}

export interface CatalogCategory {
  id: number;
  name: string;
  products: CatalogProduct[];
}

export interface CatalogResponse {
  code: number;
  message: string;
  object: CatalogCategory[];
}

/**
 * TreeSelect-compatible node structure
 */
// Use PrimeNG's TreeNode for compatibility with p-treeSelect

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private readonly baseUrl = `${environment.apiUrl}/tenant-menu-categories`;

  constructor(private http: HttpClient) {}

  /**
   * Fetches categories and products for a given tenant.
   * Returns a catalog structure grouped by category.
   */
  getCategoriesWithProducts(tenantId: number): Observable<CatalogCategory[]> {
    const url = `${this.baseUrl}/catalog/categories-with-products?tenantId=${tenantId}`;
    return this.http.get<CatalogResponse>(url)
      .pipe(
        map(response => response?.object || [])
      );
  }

  /**
   * Converts catalog data to TreeSelect-compatible nodes.
   * Each category becomes a parent node with products as children.
   * Categories are NOT selectable; only products can be selected.
   */
  mapToTreeNodes(categories: CatalogCategory[]): TreeNode[] {
    return (categories || []).map(cat => ({
      label: cat.name,
      key: `cat-${cat.id}`,
      selectable: false, // Categories cannot be selected
      children: (cat.products || []).map(product => ({
        label: product.name,
        key: `${product.id}`,
        selectable: true // Only products can be selected
      }))
    }));
  }
}
