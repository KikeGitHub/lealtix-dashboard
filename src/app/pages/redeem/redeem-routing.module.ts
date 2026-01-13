import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RedeemPageComponent } from './pages/redeem-page/redeem-page.component';

const routes: Routes = [
  {
    path: ':qrToken',
    component: RedeemPageComponent
  },
  {
    path: '',
    component: RedeemPageComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RedeemRoutingModule { }
