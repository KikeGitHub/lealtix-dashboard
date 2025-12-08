import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { CampaignTemplate } from '@/models/campaign-template.model';
import { GenericResponse } from '@/models/generic-response.model';
import { ApiResponseMapper } from './api-response.mapper';
import { environment } from '@/pages/commons/environment';

@Injectable({
  providedIn: 'root'
})
export class CampaignTemplateService {
  private readonly baseUrl = `${environment.apiUrl}/campaign-templates`;

  // Cache para las plantillas
  private templatesCache$?: Observable<CampaignTemplate[]>;

  constructor(
    private http: HttpClient,
    private mapper: ApiResponseMapper
  ) {}

  /**
   * Obtiene todas las plantillas de campañas (con cache)
   */
  getAll(): Observable<CampaignTemplate[]> {
    if (!this.templatesCache$) {
      this.templatesCache$ = this.http.get<GenericResponse<CampaignTemplate[]>>(this.baseUrl)
        .pipe(
          map(response => {
            const mappedResponse = this.mapper.mapGenericResponse(response);
            return (mappedResponse.object || []).map(template =>
              this.mapper.mapCampaignTemplate(template)
            );
          }),
          shareReplay(1)
        );
    }
    return this.templatesCache$;
  }

  /**
   * Obtiene una plantilla por ID
   */
  get(id: number): Observable<CampaignTemplate> {
    return this.http.get<GenericResponse<CampaignTemplate>>(`${this.baseUrl}/${id}`)
      .pipe(
        map(response => {
          const mappedResponse = this.mapper.mapGenericResponse(response);
          return this.mapper.mapCampaignTemplate(mappedResponse.object);
        })
      );
  }

  /**
   * Crea una nueva plantilla
   */
  create(dto: CampaignTemplate): Observable<CampaignTemplate> {
    return this.http.post<GenericResponse<CampaignTemplate>>(this.baseUrl, dto)
      .pipe(
        map(response => {
          // Limpiar cache al crear
          this.clearCache();
          const mappedResponse = this.mapper.mapGenericResponse(response);
          return this.mapper.mapCampaignTemplate(mappedResponse.object);
        })
      );
  }

  /**
   * Actualiza una plantilla existente
   */
  update(id: number, dto: CampaignTemplate): Observable<CampaignTemplate> {
    return this.http.put<GenericResponse<CampaignTemplate>>(`${this.baseUrl}/${id}`, dto)
      .pipe(
        map(response => {
          // Limpiar cache al actualizar
          this.clearCache();
          const mappedResponse = this.mapper.mapGenericResponse(response);
          return this.mapper.mapCampaignTemplate(mappedResponse.object);
        })
      );
  }

  /**
   * Elimina una plantilla
   */
  delete(id: number): Observable<void> {
    return this.http.delete<GenericResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(
        map(() => {
          // Limpiar cache al eliminar
          this.clearCache();
          return;
        })
      );
  }

  /**
   * Limpia el cache de plantillas
   */
  private clearCache(): void {
    this.templatesCache$ = undefined;
  }

  /**
   * Refresca el cache manualmente
   */
  refreshCache(): Observable<CampaignTemplate[]> {
    this.clearCache();
    return this.getAll();
  }
}
