import { RedemptionChannel } from './redemption-request.model';

export interface RedemptionResponse {
  success: boolean;
  message: string;

  // Información de la redención
  redemptionId?: number;
  redeemedAt?: string;
  redeemedBy?: string;
  channel?: RedemptionChannel;

  // Información del cupón
  couponCode?: string;
  couponId?: number;

  // Información de la campaña
  campaignId?: number;
  campaignTitle?: string;
  benefit?: string;

  // Información del cliente
  customerName?: string;
  customerEmail?: string;

  // Información del tenant
  tenantId?: number;
  tenantName?: string;
}
