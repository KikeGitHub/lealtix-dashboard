export interface CouponValidationResponse {
  valid: boolean;
  message: string;

  // Información del cupón
  couponCode?: string | null;
  status?: CouponStatus | null;
  expiresAt?: string | null;
  redeemedAt?: string | null;
  redeemedBy?: string | null;
  isExpired?: boolean;
  expired?: boolean;
  alreadyRedeemed?: boolean;

  // Información de la campaña
  campaignId?: number | null;
  campaignTitle?: string | null;
  campaignDescription?: string | null;
  benefit?: string | null;

  // Información del cliente
  customerName?: string | null;
  customerEmail?: string | null;

  // Información del tenant
  tenantId?: number | null;
  tenantName?: string | null;
}

export enum CouponStatus {
  CREATED = 'CREATED',
  SENT = 'SENT',
  ACTIVE = 'ACTIVE',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}
