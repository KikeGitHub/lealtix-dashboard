export interface RedemptionRequest {
  redeemedBy: string;
  channel: RedemptionChannel;
  location?: string;
  metadata?: string;
  ipAddress?: string;
  userAgent?: string;
}

export enum RedemptionChannel {
  QR_WEB = 'QR_WEB',
  QR_ADMIN = 'QR_ADMIN',
  MANUAL = 'MANUAL',
  API = 'API'
}
