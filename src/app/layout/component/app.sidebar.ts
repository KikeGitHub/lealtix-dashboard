import { Component, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AppMenu } from './app.menu';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [AppMenu, ButtonModule],
    template: ` <div class="layout-sidebar">
        <div class="layout-menu-wrapper">
            <app-menu></app-menu>
        </div>
        <div class="sidebar-footer">
            <button pButton type="button" icon="pi pi-power-off" class="p-button-text logout-button" (click)="logout()">Cerrar Sesión</button>
        </div>
    </div>`
})
export class AppSidebar {
    constructor(public el: ElementRef, private router: Router) {}

    logout(): void {
        try {
            sessionStorage.clear();
            localStorage.clear();
        } catch (e) {
            console.warn('Error clearing storage during logout', e);
        }
        // Navigate to login page
        this.router.navigate(['/dashboard/auth/login']).then(() => {
            // ensure a fresh state
            window.location.reload();
        });
    }
}
