import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

// Routing
import { RedeemRoutingModule } from './redeem-routing.module';

// Services
import { RedemptionService } from './services/redemption.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule,
    RedeemRoutingModule
  ],
  providers: [
    RedemptionService
  ]
})
export class RedeemModule { }
