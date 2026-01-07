export interface TimeSeriesCountDTO {
  periodStart: string;
  count: number;
}

export interface CouponStatsDTO {
  campaignId: number;
  campaignName: string;
  couponsCreated: number;
  couponsRedeemed: number;
  redemptionRatePct: number;
}

export interface SalesSummaryDTO {
  totalSales: number;
  avgTicket: number;
  transactionCount: number;
}

export interface CampaignPerformanceDTO {
  campaignId: number;
  campaignName: string;
  couponsIssued: number;
  redemptions: number;
  totalSales: number;
  avgTicket: number;
  redemptionRatePct: number;
}
