export interface CouponValidationResponse {
  valid: boolean;
  message: string;

  // Información del cupón
  couponCode?: string;
  status?: CouponStatus;
  expiresAt?: string;
  redeemedAt?: string;
  isExpired?: boolean;
  alreadyRedeemed?: boolean;

  // Información de la campaña
  campaignId?: number;
  campaignTitle?: string;
  campaignDescription?: string;
  benefit?: string;

  // Información del cliente
  customerName?: string;
  customerEmail?: string;

  // Información del tenant
  tenantId?: number;
  tenantName?: string;
}

export enum CouponStatus {
  CREATED = 'CREATED',
  SENT = 'SENT',
  ACTIVE = 'ACTIVE',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}
