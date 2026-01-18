/**
 * Configures reward settings for a campaign
 * Each reward type has specific required/optional fields
 */
export interface ConfigureRewardRequest {
  rewardType: 'PERCENT_DISCOUNT' | 'FIXED_AMOUNT' | 'FREE_PRODUCT' | 'BUY_X_GET_Y' | 'CUSTOM' | 'NONE';
  numericValue?: number; // % for PERCENT_DISCOUNT, amount for FIXED_AMOUNT
  productId?: number; // for FREE_PRODUCT
  buyQuantity?: number; // for BUY_X_GET_Y
  freeQuantity?: number; // for BUY_X_GET_Y
  customConfig?: string; // for CUSTOM
  description?: string; // max 500 chars, required if rewardType !== 'NONE'
  minPurchaseAmount?: number; // optional minimum purchase to qualify
  usageLimit?: number; // optional maximum number of uses
}

/**
 * Request payload for updating a campaign
 * All fields are optional since this is a PATCH-like operation
 */
export interface UpdateCampaignRequest {
  title?: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  promoType?: string | null;
  promoValue?: string | null;
  startDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  status?: string;
  callToAction?: string;
  channels?: string[];
  segmentation?: string[];
  isAutomatic?: boolean;
  reward?: ConfigureRewardRequest; // nested reward configuration
}
