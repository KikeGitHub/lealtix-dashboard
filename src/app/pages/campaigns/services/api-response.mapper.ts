import { Injectable } from '@angular/core';
import { GenericResponse, GenericResponseProd } from '@/models/generic-response.model';
import { CampaignTemplate } from '@/models/campaign-template.model';
import { CampaignResponse } from '@/models/campaign.model';
import { CampaignResult } from '@/models/campaign-result.model';

@Injectable({
  providedIn: 'root'
})
export class ApiResponseMapper {

  /**
   * Mapea una respuesta genérica y convierte las fechas string a Date
   */
  mapGenericResponse<T>(response: GenericResponse<T>): GenericResponse<T> {
    return {
      code: response.code,
      message: response.message,
      object: this.mapDateFields(response.object)
    };
  }

  /**
   * Mapea una respuesta genérica con paginación
   */
  mapGenericResponseProd<T>(response: GenericResponseProd<T>): GenericResponseProd<T> {
    return {
      code: response.code,
      message: response.message,
      object: this.mapDateFields(response.object),
      totalRecords: response.totalRecords
    };
  }

  /**
   * Convierte campos de fecha string a Date objects
   */
  private mapDateFields<T>(obj: T): T {
    if (!obj) return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => this.mapDateFields(item)) as T;
    }

    if (typeof obj === 'object') {
      const mapped = { ...obj } as any;

      // Campos de fecha conocidos
      const dateFields = ['startDate', 'endDate', 'createdAt', 'updatedAt', 'lastViewAt', 'lastRedemptionAt'];

      for (const field of dateFields) {
        if (mapped[field] && typeof mapped[field] === 'string') {
          mapped[field] = new Date(mapped[field]);
        }
      }

      return mapped;
    }

    return obj;
  }

  /**
   * Mapea específicamente una plantilla de campaña
   */
  mapCampaignTemplate(template: any): CampaignTemplate {
    return this.mapDateFields(template) as CampaignTemplate;
  }

  /**
   * Mapea específicamente una respuesta de campaña
   */
  mapCampaignResponse(campaign: any): CampaignResponse {
    debugger;
    const mapped = this.mapDateFields(campaign) as CampaignResponse;

    // Mapear template anidado si existe
    if (mapped.template) {
      mapped.template = this.mapCampaignTemplate(mapped.template);
    }

    return mapped;
  }

  /**
   * Mapea específicamente un resultado de campaña
   */
  mapCampaignResult(result: any): CampaignResult {
    return this.mapDateFields(result) as CampaignResult;
  }
}
