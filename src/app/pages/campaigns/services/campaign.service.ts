import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CreateCampaignRequest, UpdateCampaignRequest, CampaignResponse } from '@/models/campaign.model';
import { GenericResponse } from '@/models/generic-response.model';
import { ApiResponseMapper } from './api-response.mapper';
import { environment } from '@/pages/commons/environment';

@Injectable({
  providedIn: 'root'
})
export class CampaignService {
  private readonly baseUrl = `${environment.apiUrl}/campaigns`;

  constructor(
    private http: HttpClient,
    private mapper: ApiResponseMapper
  ) {}

  /**
   * Crea una nueva campaña
   */
  create(req: CreateCampaignRequest): Observable<CampaignResponse> {
    return this.http.post<GenericResponse<CampaignResponse>>(this.baseUrl, req)
      .pipe(
        map(response => {
          const mappedResponse = this.mapper.mapGenericResponse(response);
          return this.mapper.mapCampaignResponse(mappedResponse.object);
        })
      );
  }

  /**
   * Actualiza una campaña existente
   */
  update(id: number, req: UpdateCampaignRequest): Observable<CampaignResponse> {
    return this.http.put<GenericResponse<CampaignResponse>>(`${this.baseUrl}/${id}`, req)
      .pipe(
        map(response => {
          const mappedResponse = this.mapper.mapGenericResponse(response);
          return this.mapper.mapCampaignResponse(mappedResponse.object);
        })
      );
  }

  /**
   * Obtiene una campaña por ID
   */
  get(id: number): Observable<CampaignResponse> {
    return this.http.get<GenericResponse<CampaignResponse>>(`${this.baseUrl}/${id}`)
      .pipe(
        map(response => {
          const mappedResponse = this.mapper.mapGenericResponse(response);
          return this.mapper.mapCampaignResponse(mappedResponse.object);
        })
      );
  }

  /**
   * Obtiene todas las campañas de un negocio
   */
  getByBusiness(businessId: number): Observable<CampaignResponse[]> {
    return this.http.get<GenericResponse<CampaignResponse[]>>(`${this.baseUrl}/business/${businessId}`)
      .pipe(
        map(response => {
            debugger;
          const mappedResponse = this.mapper.mapGenericResponse(response);
          return (mappedResponse.object || []).map(campaign =>
            this.mapper.mapCampaignResponse(campaign)
          );
        })
      );
  }

  /**
   * Elimina una campaña
   */
  delete(id: number): Observable<void> {
    return this.http.delete<GenericResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(
        map(() => undefined)
      );
  }
}
