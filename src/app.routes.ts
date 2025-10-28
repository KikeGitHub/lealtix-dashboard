import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { LandingEditorComponent } from '@/pages/admin-page/landing-editor.component';
import { ProductMenuComponent } from '@/pages/products-menu/products-menu.component';
import { Login } from '@/pages/auth/login';

export const appRoutes: Routes = [
    { path: 'auth/login', component: Login},
    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', component: Dashboard },
            { path: 'adminPage', component: LandingEditorComponent },
            { path: 'adminMenu', component: ProductMenuComponent },
            { path: 'documentation', component: Documentation }
        ]
    },

    { path: '**', redirectTo: '/notfound' },

];
