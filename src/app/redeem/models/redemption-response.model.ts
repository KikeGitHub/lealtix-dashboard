import { RedemptionChannel } from './redemption-request.model';

export interface RedemptionResponse {
  success: boolean;
  message: string;

  // Información de la redención
  redemptionId?: number | null;
  redeemedAt?: string | null;
  redeemedBy?: string | null;
  channel?: RedemptionChannel | null;

  // Información del cupón
  couponCode?: string | null;
  couponId?: number | null;

  // Información de la campaña
  campaignId?: number | null;
  campaignTitle?: string | null;
  benefit?: string | null;

  // Información del cliente
  customerName?: string | null;
  customerEmail?: string | null;

  // Información del tenant
  tenantId?: number | null;
  tenantName?: string | null;

  // Información de montos y descuentos
  originalAmount?: number | null;
  discountAmount?: number | null;
  finalAmount?: number | null;
  couponType?: string | null;
  couponValue?: number | null;
}
