# Módulo de Gestión de Campañas

## 📋 Resumen

Módulo completo y escalable en Angular 20 para la gestión de campañas de marketing y plantillas de promociones. Desarrollado con las últimas mejores prácticas de Angular, PrimeNG 20 y TypeScript estricto.

## 🏗️ Arquitectura

### Estructura de Archivos

```
src/app/
├── models/                              # Modelos globales
│   ├── enums.ts                        # PromoType, CampaignStatus
│   ├── generic-response.model.ts       # Respuestas del API
│   ├── campaign-template.model.ts      # Plantillas
│   ├── campaign.model.ts               # Campañas (Request/Response)
│   └── campaign-result.model.ts        # Métricas
├── pages/campaigns/
│   ├── services/                       # Servicios (singleton)
│   │   ├── api-response.mapper.ts      # Mapeo y transformación
│   │   ├── campaign-template.service.ts # CRUD plantillas
│   │   ├── campaign.service.ts         # CRUD campañas
│   │   └── campaign-result.service.ts  # Métricas
│   ├── components/                     # Componentes standalone
│   │   ├── campaign-list/              # Lista con filtros
│   │   ├── campaign-form/              # Formulario reactive
│   │   ├── campaign-details/           # Vista detallada + métricas
│   │   └── campaign-templates-list/    # Selector de plantillas
│   ├── utils/
│   │   ├── date-range.validator.ts     # Validadores personalizados
│   │   └── formatters.ts              # Utilidades de formato
│   └── guards/
│       └── campaign-exists.guard.ts    # Validación de existencia
├── interceptors/                       # Interceptors globales
│   ├── error.interceptor.ts           # Manejo global de errores
│   └── loading.interceptor.ts         # Estado de loading
└── app.routes.ts                      # Rutas integradas
```

## 🔧 Tecnologías Utilizadas

- **Angular**: 20.x (standalone components, signals, takeUntilDestroyed)
- **PrimeNG**: 20.x (UI components modernos)
- **RxJS**: 7.8.x (operadores modernos, manejo de streams)
- **TypeScript**: 5.8.x (strict mode, sin any)
- **Reactive Forms**: Validaciones robustas

## 🚀 Funcionalidades

### Gestión de Plantillas
- ✅ Lista responsive con skeleton loading
- ✅ Cache con shareReplay para optimización
- ✅ Aplicación automática de valores por defecto

### Gestión de Campañas
- ✅ CRUD completo (Create, Read, Update, Delete)
- ✅ Formulario reactivo con validaciones avanzadas
- ✅ Filtros por texto y estado
- ✅ Paginación y ordenamiento

### Métricas en Tiempo Real
- ✅ Visualizaciones (views), clics y redenciones
- ✅ Cálculo automático de CTR y conversión
- ✅ Simulación de eventos para testing

### Validaciones
- ✅ Rangos de fechas coherentes
- ✅ Validación dinámica según tipo de promoción
- ✅ Campos obligatorios con mensajes descriptivos

## 🛠️ Servicios

### CampaignTemplateService
```typescript
getAll(): Observable<CampaignTemplate[]>        // Con cache
get(id: number): Observable<CampaignTemplate>
create(dto: CampaignTemplate): Observable<CampaignTemplate>
update(id: number, dto: CampaignTemplate): Observable<CampaignTemplate>
delete(id: number): Observable<void>
refreshCache(): Observable<CampaignTemplate[]>  // Manual refresh
```

### CampaignService
```typescript
create(req: CreateCampaignRequest): Observable<CampaignResponse>
update(id: number, req: UpdateCampaignRequest): Observable<CampaignResponse>
get(id: number): Observable<CampaignResponse>
getByBusiness(businessId: number): Observable<CampaignResponse[]>
delete(id: number): Observable<void>
```

### CampaignResultService
```typescript
getByCampaign(campaignId: number): Observable<CampaignResult>
incrementViews(campaignId: number): Observable<void>
incrementClicks(campaignId: number): Observable<void>
incrementRedemptions(campaignId: number): Observable<void>
```

## 🎯 Rutas Implementadas

```typescript
/dashboard/campaigns              // Lista de campañas
/dashboard/campaigns/new          // Formulario de nueva campaña
/dashboard/campaigns/:id          // Detalles y métricas
/dashboard/campaign-templates     // Gestión de plantillas
```

## 📡 API Endpoints

### Plantillas
- `GET /api/campaign-templates` - Lista todas las plantillas
- `GET /api/campaign-templates/{id}` - Obtiene una plantilla
- `POST /api/campaign-templates` - Crea plantilla
- `PUT /api/campaign-templates/{id}` - Actualiza plantilla
- `DELETE /api/campaign-templates/{id}` - Elimina plantilla

### Campañas
- `POST /api/campaigns` - Crea campaña
- `PUT /api/campaigns/{id}` - Actualiza campaña
- `GET /api/campaigns/{id}` - Obtiene campaña
- `GET /api/campaigns/business/{businessId}` - Campañas por negocio
- `DELETE /api/campaigns/{id}` - Elimina campaña

### Métricas
- `GET /api/campaign-results/campaign/{campaignId}` - Resultados
- `POST /api/campaign-results/campaign/{campaignId}/views` - Incrementa vistas
- `POST /api/campaign-results/campaign/{campaignId}/clicks` - Incrementa clics
- `POST /api/campaign-results/campaign/{campaignId}/redemptions` - Incrementa redenciones

## 🎨 Componentes UI

### CampaignListComponent
- Tabla con filtros y paginación
- Acciones en línea (ver, editar, eliminar)
- Estados visuales con chips coloridos
- Confirmación de eliminación

### CampaignFormComponent
- Formulario reactivo con secciones organizadas
- Validaciones en tiempo real
- Selector de plantillas con preview
- Manejo de fechas y canales de distribución

### CampaignDetailsComponent
- Vista completa de la campaña
- Panel de métricas en tiempo real
- Simulación de eventos para testing
- Navegación intuitiva

### CampaignTemplatesListComponent
- Grid responsive con skeleton loading
- Aplicación directa de plantillas
- Estados de carga y vacío

## 🔐 Seguridad y Validaciones

### Interceptors
- **ErrorInterceptor**: Manejo global de errores HTTP
- **LoadingInterceptor**: Estado global de loading

### Guards
- **CampaignExistsGuard**: Valida existencia de campaña antes de acceder

### Validadores
- **DateRangeValidator**: Fechas coherentes
- **PromoValueValidator**: Valores según tipo de promoción
- **FutureDateValidator**: Fechas futuras para nuevas campañas

## 🚦 Estados y Enums

```typescript
enum CampaignStatus {
  DRAFT = 'DRAFT',           // Borrador
  ACTIVE = 'ACTIVE',         // Activa
  INACTIVE = 'INACTIVE',     // Inactiva
  SCHEDULED = 'SCHEDULED'    // Programada
}

enum PromoType {
  DISCOUNT = 'DISCOUNT',     // Descuento %
  AMOUNT = 'AMOUNT',         // Descuento $
  BOGO = 'BOGO',            // Compra uno lleva otro
  FREE_ITEM = 'FREE_ITEM',  // Artículo gratis
  CUSTOM = 'CUSTOM'         // Personalizado
}
```

## 🧪 Testing y Desarrollo

### Simulación de Métricas
- Botones para simular views, clicks y redemptions
- Cálculo automático de CTR y tasas de conversión
- Refresh manual de métricas

### Estado de Loading
- Skeletons durante la carga
- Estados vacíos informativos
- Feedback visual en todas las acciones

## 📈 Optimizaciones

### Performance
- Cache de plantillas con shareReplay
- Componentes standalone para tree-shaking
- Lazy loading preparado (estructura modular)

### UX/UI
- Responsive design con PrimeFlex
- Estados de loading y error
- Accesibilidad con aria-labels
- Feedback visual inmediato

## 🔮 Extensibilidad

### Preparado para
- NgRx/Signals para state management avanzado
- Testing unitario e integración
- Lazy loading de módulos
- Internacionalización (i18n)

## 📝 Notas de Implementación

1. **Modelos Globales**: Ubicados en `src/app/models` para reutilización
2. **Servicios Singleton**: `providedIn: 'root'` para consistencia
3. **Componentes Standalone**: Siguiendo la arquitectura moderna de Angular
4. **Strict TypeScript**: Sin uso de `any`, tipado completo
5. **Manejo de Errores**: Centralizado en interceptors
6. **Transformación de Fechas**: Automática en ApiResponseMapper

El módulo está listo para producción y sigue todas las mejores prácticas de Angular 20, con una arquitectura escalable y mantenible.
