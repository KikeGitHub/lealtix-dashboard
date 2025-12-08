import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CampaignResult } from '@/models/campaign-result.model';
import { GenericResponse } from '@/models/generic-response.model';
import { ApiResponseMapper } from './api-response.mapper';

@Injectable({
  providedIn: 'root'
})
export class CampaignResultService {
  private readonly baseUrl = '/api/campaign-results';

  constructor(
    private http: HttpClient,
    private mapper: ApiResponseMapper
  ) {}

  /**
   * Obtiene los resultados de una campaña
   */
  getByCampaign(campaignId: number): Observable<CampaignResult> {
    return this.http.get<GenericResponse<CampaignResult>>(`${this.baseUrl}/campaign/${campaignId}`)
      .pipe(
        map(response => {
          const mappedResponse = this.mapper.mapGenericResponse(response);
          return this.mapper.mapCampaignResult(mappedResponse.object);
        })
      );
  }

  /**
   * Incrementa las visualizaciones de una campaña
   */
  incrementViews(campaignId: number): Observable<void> {
    return this.http.post<GenericResponse<void>>(`${this.baseUrl}/campaign/${campaignId}/views`, {})
      .pipe(
        map(() => undefined)
      );
  }

  /**
   * Incrementa los clics de una campaña
   */
  incrementClicks(campaignId: number): Observable<void> {
    return this.http.post<GenericResponse<void>>(`${this.baseUrl}/campaign/${campaignId}/clicks`, {})
      .pipe(
        map(() => undefined)
      );
  }

  /**
   * Incrementa las redenciones de una campaña
   */
  incrementRedemptions(campaignId: number): Observable<void> {
    return this.http.post<GenericResponse<void>>(`${this.baseUrl}/campaign/${campaignId}/redemptions`, {})
      .pipe(
        map(() => undefined)
      );
  }
}
