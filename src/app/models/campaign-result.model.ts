export interface CampaignResult {
  id: number;
  campaignId: number;
  views: number;
  clicks: number;
  redemptions: number;
  lastViewAt?: Date;
  lastRedemptionAt?: Date;
}
