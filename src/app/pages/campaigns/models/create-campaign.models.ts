/**
 * Models for Create Campaign Component
 */

export interface CampaignFormModel {
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  promoType?: string;
  promoValue?: string;
  startDate?: Date;
  endDate?: Date;
  callToAction?: string;
  buttonText?: string;
  channels?: string[];
  segmentation?: string;
  isAutomatic?: boolean;
  dynamicFields?: { [key: string]: any };
}

export interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox';
  required?: boolean;
  options?: string[];
  placeholder?: string;
  defaultValue?: any;
}

export interface CampaignPreviewData {
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  promoType?: string;
  promoValue?: string;
  startDate?: Date;
  endDate?: Date;
  buttonText?: string;
}
