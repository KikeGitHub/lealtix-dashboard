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

  // Información de descuento y montos
  minRedemptionAmount?: number | null;
  couponType?: string | null;
  couponValue?: number | null;

  // Información del reward (desde promotion_reward)
  minPurchaseAmount?: number | null;
  usageLimit?: number | null;
  usageCount?: number | null;
  rewardType?: string | null;
  numericValue?: number | null;
  rewardDescription?: string | null;
}

export enum CouponStatus {
  CREATED = 'CREATED',
  SENT = 'SENT',
  ACTIVE = 'ACTIVE',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}
