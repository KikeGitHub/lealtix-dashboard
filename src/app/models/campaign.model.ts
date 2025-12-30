import { CampaignTemplate } from './campaign-template.model';

export interface CreateCampaignRequest {
  templateId?: number | null;
  businessId: number;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  promoType?: string;
  promoValue?: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  callToAction?: string;
  channels?: string[];
  segmentation?: string;
  isAutomatic?: boolean;
  isDraft?: boolean;
}

export interface UpdateCampaignRequest {
  title?: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  promoType?: string;
  promoValue?: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  status?: string;
  callToAction?: string;
  channels?: string[];
  segmentation?: string;
  isAutomatic?: boolean;
  isDraft?: boolean;
}

export interface CampaignResponse {
  id: number;
  template?: CampaignTemplate;
  businessId: number;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  promoType?: string;
  promoValue?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  callToAction?: string;
  channels?: string[];
  segmentation?: string;
  isAutomatic?: boolean;
  isDraft?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CampaignValidationResult {
  campaignId: number;
  configComplete: boolean;
  missingItems: string[];
  severity: 'OK' | 'ACTION_REQUIRED';
}

export interface CampaignWithValidation {
  campaign: CampaignResponse;
  validation: CampaignValidationResult;
}
