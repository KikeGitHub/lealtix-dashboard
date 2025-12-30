import { RewardType } from '@/models/enums';

/**
 * Request para crear/actualizar un reward de campaña (PromotionRewardDTO)
 */
export interface CreateRewardRequest {
  rewardType: RewardType;
  numericValue?: number;
  productId?: number;
  buyQuantity?: number;
  freeQuantity?: number;
  customConfig?: string;
  description?: string;
  minPurchaseAmount?: number;
  usageLimit?: number;
}

/**
 * Response de un reward de campaña (PromotionRewardResponse)
 */
export interface RewardResponse {
  id: number;
  campaignId: number;
  rewardType: RewardType;
  numericValue?: number;
  productId?: number;
  buyQuantity?: number;
  freeQuantity?: number;
  customConfig?: string;
  description?: string;
  minPurchaseAmount?: number;
  usageLimit?: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}
