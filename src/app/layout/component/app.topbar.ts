import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a class="layout-topbar-logo" routerLink="/">
                <img src="https://res.cloudinary.com/dnaqqulme/image/upload/c_scale,w_50,h_40/v1759897289/lealtix_logo_transp_qcp5h9.png" alt="Lealtix Logo"/>
                <span>Dashboard</span>
            </a>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
                <app-configurator></app-configurator>
            </div>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content relative inline-block">
                    <button #profileBtn type="button" class="layout-topbar-action" (click)="toggleProfileMenu()">
                        <i class="pi pi-user"></i>
                        <span>Profile</span>
                    </button>
                    <div #profileMenu *ngIf="profileMenuOpen" [ngStyle]="menuStyle" class="absolute top-full mt-2 w-40 bg-white dark:bg-surface-900 border rounded shadow-lg z-50">
                        <button type="button" class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-surface-800" (click)="logout()">Log out</button>
                    </div>

                    <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                        <i class="pi pi-ellipsis-v"></i>
                    </button>
                </div>
            </div>



        </div>
    </div>`
})
export class AppTopbar {
    items!: MenuItem[];
    profileMenuOpen: boolean = false;
    menuStyle: { [key: string]: string } = { left: '0' };
    // ViewChild refs
    private profileBtnEl!: HTMLElement | null;
    private profileMenuEl!: HTMLElement | null;

    constructor(public layoutService: LayoutService, private router: Router) {}

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }

    toggleProfileMenu() {
        this.profileMenuOpen = !this.profileMenuOpen;
        // Defer measuring until the menu is rendered
        setTimeout(() => this.adjustMenuPosition(), 0);
    }

    adjustMenuPosition() {
        try {
            const btn = document.querySelector('#app-root .layout-topbar .layout-topbar-menu .layout-topbar-menu-content button.layout-topbar-action');
            const menu = document.querySelector('#app-root .layout-topbar .layout-topbar-menu .layout-topbar-menu-content div[ng-reflect-ng-if]') as HTMLElement | null;

            // Fallback: try to query by structure if selectors differ
            const menuEl = document.querySelector('.layout-topbar-menu-content > div.absolute') as HTMLElement | null;
            const menuRect = (menuEl || menu)?.getBoundingClientRect();
            const btnRect = (btn as HTMLElement | null)?.getBoundingClientRect();
            if (!menuRect || !btnRect) return;

            const viewportWidth = window.innerWidth;
            // If menu overflows right edge, align right with button
            if (btnRect.left + menuRect.width > viewportWidth) {
                this.menuStyle = { right: '0', left: 'auto' };
            } else {
                this.menuStyle = { left: '0', right: 'auto' };
            }
        } catch (e) {
            // ignore
        }
    }

    logout() {
        // Limpiar storage relacionado con la sesión
        try {
            localStorage.removeItem('loginObject');
        } catch (e) {}
        try {
            sessionStorage.removeItem('loginObject');
        } catch (e) {}
        try {
            localStorage.removeItem('accessToken');
        } catch (e) {}

        // Redirigir a la ruta de login
        this.router.navigate(['/auth/login']);
    }
}
