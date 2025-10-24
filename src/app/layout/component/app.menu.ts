import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

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
export class AppMenu {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'Home',
                items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] },
                        { label: 'Admin Page', icon: 'pi pi-fw pi-globe',  routerLink: ['/adminPage'] },
                        { label: 'Menu de Productos', icon: 'pi pi-fw pi-bars',  routerLink: ['/adminMenu'] },
                        { label: 'Campañas', icon: 'pi pi-fw pi-id-card', routerLink: ['/uikit/formlayout']},
                        { label: 'Reportes', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/uikit/charts'] },
                        { label: 'Usuarios', icon: 'pi pi-fw pi-id-card', routerLink: ['/uikit/formlayout'] },
                        { label: 'Utils', icon: 'pi pi-fw pi-table', routerLink: ['/uikit/table'] }
                    ]
            }
        ];
    }
}
