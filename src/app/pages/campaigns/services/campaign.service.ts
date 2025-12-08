import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
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
    debugger;
    return this.http.post<GenericResponse<CampaignResponse>>(this.baseUrl, req)
      .pipe(
        map(response => {
          const mappedResponse = this.mapper.mapGenericResponse(response);
          return this.mapper.mapCampaignResponse(mappedResponse.object);
        }),
        tap({
          next: (response: CampaignResponse) => {
            console.log('Campaña creada exitosamente:', response);
          },
          error: (error: any) => {
            console.error('Error al crear campaña:', error);
          }
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

  /**
   * Guarda una campaña como borrador
   * Los borradores tienen validaciones más flexibles y pueden ser completados más tarde
   */
  saveDraft(req: CreateCampaignRequest): Observable<CampaignResponse> {
    debugger;
    const draftRequest = { ...req, isDraft: true };
    return this.http.post<GenericResponse<CampaignResponse>>(`${this.baseUrl}/draft`, draftRequest)
      .pipe(
        map(response => {
          const mappedResponse = this.mapper.mapGenericResponse(response);
          return this.mapper.mapCampaignResponse(mappedResponse.object);
        }),
        tap({
          next: (response: CampaignResponse) => {
            console.log('Borrador guardado exitosamente:', response);
          },
          error: (error: any) => {
            console.error('Error al guardar borrador:', error);
          }
        })
      );
  }

  /**
   * Actualiza un borrador existente
   */
  updateDraft(id: number, req: UpdateCampaignRequest): Observable<CampaignResponse> {
    const draftRequest = { ...req, isDraft: true };
    return this.http.put<GenericResponse<CampaignResponse>>(`${this.baseUrl}/draft/${id}`, draftRequest)
      .pipe(
        map(response => {
          const mappedResponse = this.mapper.mapGenericResponse(response);
          return this.mapper.mapCampaignResponse(mappedResponse.object);
        })
      );
  }

  /**
   * Publica un borrador (lo convierte en campaña activa)
   */
  publishDraft(id: number): Observable<CampaignResponse> {
    return this.http.post<GenericResponse<CampaignResponse>>(`${this.baseUrl}/draft/${id}/publish`, {})
      .pipe(
        map(response => {
          const mappedResponse = this.mapper.mapGenericResponse(response);
          return this.mapper.mapCampaignResponse(mappedResponse.object);
        })
      );
  }
}
