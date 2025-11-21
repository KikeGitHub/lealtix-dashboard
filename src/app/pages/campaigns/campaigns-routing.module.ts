import { Routes } from '@angular/router';
import { CampaignListComponent } from './components/campaign-list/campaign-list.component';
import { CampaignFormComponent } from './components/campaign-form/campaign-form.component';
import { CampaignDetailsComponent } from './components/campaign-details/campaign-details.component';
import { CampaignTemplatesListComponent } from './components/campaign-templates-list/campaign-templates-list.component';

export const campaignsRoutes: Routes = [
  {
    path: 'campaigns',
    component: CampaignListComponent,
    title: 'Gestión de Campañas'
  },
  {
    path: 'campaigns/new',
    component: CampaignFormComponent,
    title: 'Nueva Campaña'
  },
  {
    path: 'campaigns/:id',
    component: CampaignDetailsComponent,
    title: 'Detalles de Campaña'
  },
  {
    path: 'campaign-templates',
    component: CampaignTemplatesListComponent,
    title: 'Plantillas de Campañas'
  }
];
