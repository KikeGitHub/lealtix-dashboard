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
  startDate?: Date;
  endDate?: Date;
  callToAction?: string;
  channels?: string[];
  segmentation?: string;
  isAutomatic?: boolean;
}

export interface UpdateCampaignRequest {
  title?: string;
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
  createdAt?: Date;
  updatedAt?: Date;
}
