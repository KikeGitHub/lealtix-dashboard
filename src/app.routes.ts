import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { LandingEditorComponent } from '@/pages/admin-page/landing-editor.component';
import { ProductMenuComponent } from '@/pages/products-menu/products-menu.component';
import { LoginComponent } from '@/auth/login/login.component';
import { Error } from '@/auth/error/error';
import { AuthGuard } from './app/auth/auth.guard';
import { CategoriesMenuComponent } from '@/pages/categories-menu/categories-menu.component';

// Campaign components
import { CampaignListComponent } from '@/pages/campaigns/components/campaign-list/campaign-list.component';
import { CampaignFormComponent } from '@/pages/campaigns/components/campaign-form/campaign-form.component';
import { CampaignDetailsComponent } from '@/pages/campaigns/components/campaign-details/campaign-details.component';
import { CampaignTemplatesListComponent } from '@/pages/campaigns/components/campaign-templates-list/campaign-templates-list.component';
import { CreateCampaignComponent } from '@/pages/campaigns/components/create-campaign/create-campaign.component';

export const appRoutes: Routes = [
    // Everything under /dashboard/**
    // Public auth routes under /dashboard/auth/
    {
        path: 'dashboard',
        children: [
            { path: 'auth/login', component: LoginComponent },
            { path: 'auth/error', component: Error },

            // Protected application routes: require authentication
            {
                path: '',
                component: AppLayout,
                canActivate: [AuthGuard],
                canActivateChild: [AuthGuard],
                children: [
                    { path: '', redirectTo: 'kpis', pathMatch: 'full' },
                    { path: 'kpis', component: Dashboard },
                    { path: 'adminPage', component: LandingEditorComponent },
                    { path: 'categoriesMenu', component: CategoriesMenuComponent },
                    { path: 'adminMenu', component: ProductMenuComponent },
                    { path: 'documentation', component: Documentation },
                    // Campaign routes
                    { path: 'campaigns', component: CampaignListComponent, title: 'Gestión de Campañas' },
                    { path: 'campaigns/create', component: CreateCampaignComponent, title: 'Crear Campaña' },
                    { path: 'campaigns/new', component: CampaignFormComponent, title: 'Nueva Campaña' },
                    { path: 'campaigns/:id', component: CampaignDetailsComponent, title: 'Detalles de Campaña' },
                    { path: 'campaign-templates', component: CampaignTemplatesListComponent, title: 'Plantillas de Campañas' }
                ]
            }
        ]
    },

    // Default: always go to login page
    { path: '', redirectTo: '/dashboard/auth/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/dashboard/auth/login' }

];
