import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { CategoryService } from '../../pages/categories-menu/service/category.service';
import { TenantService } from '../../pages/admin-page/service/tenant.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu implements OnInit {
    model: MenuItem[] = [];

    constructor(
        private categoryService: CategoryService,
        private tenantService: TenantService
    ) {
        // Listen for category updates
        window.addEventListener('categoriesUpdated', () => {
            this.checkAndUpdateProductsMenu();
        });
    }

    ngOnInit() {
        this.model = [
            {
                label: 'Home',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/dashboard/kpis'] },
                    { label: 'Admin Page', icon: 'pi pi-fw pi-globe', routerLink: ['/dashboard/adminPage'] },
                    { label: 'Categorías', icon: 'pi pi-fw pi-tags', routerLink: ['/dashboard/categoriesMenu'] },
                    {
                        label: 'Productos',
                        icon: 'pi pi-fw pi-bars',
                        routerLink: ['/dashboard/adminMenu'],
                        disabled: true, // Will be updated based on categories check
                        title: 'Primero crea al menos una categoría'
                    },
                    { label: 'Campañas', icon: 'pi pi-fw pi-id-card', routerLink: ['/dashboard/campaigns'] },
                    { label: 'Plantillas', icon: 'pi pi-fw pi-file', routerLink: ['/dashboard/campaign-templates'] },
                    { label: 'Redención', icon: 'pi pi-fw pi-ticket', routerLink: ['/dashboard/manual-redemption'] },
                    { label: 'Reportes', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/dashboard/uikit/charts'] },
                    { label: 'Usuarios', icon: 'pi pi-fw pi-id-card', routerLink: ['/dashboard/uikit/formlayout'] },
                    { label: 'Utils', icon: 'pi pi-fw pi-table', routerLink: ['/dashboard/uikit/table'] }
                ]
            }
        ];

        // Check if categories exist and enable/disable Products menu item
        this.checkAndUpdateProductsMenu();
    }

    private checkAndUpdateProductsMenu() {
        const userStr = sessionStorage.getItem('usuario') ?? localStorage.getItem('usuario');
        if (userStr) {
            try {
                const userObj = JSON.parse(userStr);
                if (userObj && userObj.userEmail) {
                    this.tenantService.getTenantByEmail(String(userObj.userEmail || '').trim()).subscribe({
                        next: (resp) => {
                            const tenant = resp?.object;
                            const tenantId = tenant?.id ?? 0;
                            if (tenantId > 0) {
                                this.categoryService.checkCategoriesExist(tenantId).subscribe({
                                    next: (hasCategories) => {
                                        const productsItem = this.model[0]?.items?.find(item => item.label === 'Productos');
                                        if (productsItem) {
                                            productsItem.disabled = !hasCategories;
                                            productsItem.title = hasCategories ? undefined : 'Primero crea al menos una categoría';
                                        }
                                    },
                                    error: (err) => {
                                        console.error('Error checking categories:', err);
                                    }
                                });
                            }
                        },
                        error: (err) => {
                            console.error('Error fetching tenant:', err);
                        }
                    });
                }
            } catch (e) {
                console.warn('Failed to parse stored usuario:', e);
            }
        }
    }
}
