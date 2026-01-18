/**
 * Response object for a promotion reward from the backend
 * Contains full reward details including usage tracking
 */
export interface PromotionRewardResponse {
  id: number;
  campaignId: number;
  rewardType: string;
  numericValue?: number;
  productId?: number;
  buyQuantity?: number;
  freeQuantity?: number;
  customConfig?: string;
  description?: string;
  minPurchaseAmount?: number;
  usageLimit?: number;
  usageCount?: number; // tracks actual uses
  createdAt?: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
}

/**
 * Response object for a campaign from the backend
 * Includes nested promotion reward details
 */
export interface CampaignResponse {
  id: number;
  businessId?: number;
  title?: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  promoType?: string | null;
  promoValue?: string | null;
  startDate?: string;
  endDate?: string;
  status?: string;
  callToAction?: string;
  channels?: string[];
  segmentation?: string | any;
  isAutomatic?: boolean;
  createdAt?: string;
  updatedAt?: string;
  promotionReward?: PromotionRewardResponse | null;
}

/**
 * Generic API response wrapper
 * Backend returns responses in this format: { code, message, data }
 */
export interface GenericResponse<T = any> {
  code: number;
  message: string;
  data: T;
}
