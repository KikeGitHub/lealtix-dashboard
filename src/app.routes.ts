import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { LandingEditorComponent } from '@/pages/admin-page/landing-editor.component';
import { LoginComponent } from '@/auth/login/login.component';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', component: Dashboard },
            { path: 'adminPage', component: LandingEditorComponent },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    {
        path: 'auth',
        children: [
            { path: 'login', component: LoginComponent }
        ]
    },

    { path: '**', redirectTo: '/notfound' }
];
