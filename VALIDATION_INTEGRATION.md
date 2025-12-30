# Integración del Sistema de Validación de Campañas

## Resumen
Se ha integrado exitosamente el sistema de validación de campañas del backend Spring Boot en la aplicación Angular, permitiendo visualizar el estado de completitud de cada campaña y filtrar campañas incompletas.

## Cambios Realizados

### 1. Modelos TypeScript (campaign.model.ts)

#### Nuevas Interfaces:

```typescript
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
```

**Ubicación:** `src/app/models/campaign.model.ts`

---

### 2. Servicio de Campañas (campaign.service.ts)

#### Nuevos Métodos:

**a) validateCampaigns()**
```typescript
validateCampaigns(businessId: number): Observable<CampaignValidationResult[]>
```
- Endpoint: `GET /api/campaigns/business/{businessId}/validate`
- Retorna el estado de validación de todas las campañas de un negocio

**b) getCampaignsWithValidation()**
```typescript
getCampaignsWithValidation(businessId: number): Observable<CampaignWithValidation[]>
```
- Combina las llamadas a `getByBusiness()` y `validateCampaigns()` usando `forkJoin`
- Mapea cada campaña con su validación correspondiente
- Proporciona validación por defecto si no hay datos disponibles

**Ubicación:** `src/app/pages/campaigns/services/campaign.service.ts`

---

### 3. Componente de Lista de Campañas (campaign-list.component.ts)

#### Nuevas Propiedades:

```typescript
campaignsWithValidation = signal<CampaignWithValidation[]>([]);
showOnlyIncomplete = false;
```

#### Computed Property Actualizado:

```typescript
filteredCampaigns = computed(() => {
  // Filtra por texto de búsqueda
  // Filtra por estado
  // Filtra solo campañas incompletas (si está activado)
  // Ordena: campañas incompletas primero
});
```

#### Nuevos Métodos:

**a) loadCampaigns()** - Actualizado
- Ahora usa `getCampaignsWithValidation()` en lugar de `getByBusiness()`
- Actualiza tanto `campaignsWithValidation` como `campaigns` para compatibilidad

**b) getTooltipMessage()**
```typescript
getTooltipMessage(validation: CampaignValidationResult): string
```
- Retorna mensaje apropiado según el estado de validación
- Muestra "✓ Campaña lista para activar" si está completa
- Lista elementos faltantes si está incompleta

**c) toggleIncompleteFilter()**
```typescript
toggleIncompleteFilter(): void
```
- Alterna el filtro de campañas incompletas

**d) getIncompleteCount()**
```typescript
getIncompleteCount(): number
```
- Cuenta campañas incompletas para mostrar en el badge del botón

**Ubicación:** `src/app/pages/campaigns/components/campaign-list/campaign-list.component.ts`

---

### 4. Template HTML (campaign-list.component.html)

#### Cambios en el Toolbar:

```html
<p-button 
    [label]="showOnlyIncomplete ? 'Ver Todas' : 'Solo Incompletas'" 
    [icon]="showOnlyIncomplete ? 'pi pi-eye' : 'pi pi-filter'" 
    [badge]="getIncompleteCount().toString()"
    [outlined]="!showOnlyIncomplete"
    severity="contrast" 
    (onClick)="toggleIncompleteFilter()" />
```
- Botón para filtrar campañas incompletas
- Badge que muestra el conteo de campañas incompletas
- Cambia icono y texto según el estado del filtro

#### Cambios en la Tabla:

**Body Template Actualizado:**
```html
<ng-template pTemplate="body" let-item>
  <!-- item contiene { campaign, validation } -->
```

**Badge de Validación:**
```html
<span 
    class="validation-badge"
    [ngClass]="{
        'badge-complete': item.validation.configComplete,
        'badge-incomplete': !item.validation.configComplete
    }"
    [pTooltip]="getTooltipMessage(item.validation)">
    <i [class]="item.validation.configComplete ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'"></i>
    <span class="badge-text">
        {{ item.validation.configComplete ? 'Completa' : item.validation.missingItems.length + ' pendiente(s)' }}
    </span>
</span>
```

**Ubicación:** `src/app/pages/campaigns/components/campaign-list/campaign-list.component.html`

---

### 5. Estilos CSS (campaign-list.component.ts - styles)

#### Nuevos Estilos:

```css
/* Badge de validación */
.validation-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.625rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
    transition: all 0.2s ease;
}

/* Badge completa - Verde */
.badge-complete {
    background-color: #10b981;
    color: white;
}

/* Badge incompleta - Naranja */
.badge-incomplete {
    background-color: #f59e0b;
    color: white;
}

/* Tooltip personalizado */
::ng-deep .p-tooltip {
    max-width: 300px;
}
```

---

## Funcionalidades Implementadas

### ✅ 1. Validación Automática
- Las campañas se validan automáticamente al cargar la lista
- Llamada combinada a backend usando `forkJoin` para eficiencia

### ✅ 2. Badges de Validación
- Badge verde con ícono ✓ para campañas completas
- Badge naranja con ícono ⚠ para campañas incompletas
- Muestra cantidad de elementos pendientes

### ✅ 3. Tooltips Informativos
- Hover sobre badge muestra detalles
- Lista elementos faltantes con formato de viñetas
- Mensaje de confirmación para campañas completas

### ✅ 4. Filtro de Campañas Incompletas
- Botón con badge mostrando conteo de incompletas
- Toggle para mostrar/ocultar campañas completas
- Ícono cambia según estado del filtro

### ✅ 5. Ordenamiento Inteligente
- Campañas incompletas aparecen primero
- Facilita identificar qué requiere atención

### ✅ 6. Manejo de Errores
- Mensajes toast informativos
- Validación por defecto si endpoint falla
- Loading state durante carga

### ✅ 7. Compatibilidad con PrimeNG
- Usa componentes nativos de PrimeNG
- Estilos coherentes con el tema actual
- Transiciones y hover effects

---

## Endpoints del Backend Utilizados

### 1. Obtener Campañas
```
GET /api/campaign-templates?businessId={businessId}
```

### 2. Validar Campañas (NUEVO)
```
GET /api/campaigns/business/{businessId}/validate
Response: GenericResponse<CampaignValidationResult[]>
```

---

## Módulos Importados

Se agregó `TooltipModule` de PrimeNG:
```typescript
import { TooltipModule } from 'primeng/tooltip';
```

---

## Próximas Mejoras Sugeridas

1. **Refrescar validación después de editar**
   - Revalidar automáticamente después de guardar cambios

2. **Indicador visual en modo edición**
   - Mostrar checklist de validación en el formulario de edición

3. **Notificaciones proactivas**
   - Alertar cuando una campaña está lista para activar

4. **Exportar reporte de validación**
   - Generar PDF/Excel con estado de todas las campañas

5. **Validación en tiempo real**
   - WebSocket para actualizaciones automáticas

---

## Pruebas Recomendadas

- [ ] Cargar lista con campañas completas e incompletas
- [ ] Verificar tooltips muestran elementos correctos
- [ ] Filtrar solo campañas incompletas
- [ ] Verificar ordenamiento (incompletas primero)
- [ ] Validar badge muestra conteo correcto
- [ ] Probar con red lenta (loading state)
- [ ] Probar cuando endpoint de validación falla
- [ ] Verificar estilos en diferentes temas de PrimeNG

---

## Notas Técnicas

- Se mantiene retrocompatibilidad con `campaigns` signal
- Usa Angular signals para reactividad
- Implementa `computed()` para filtrado eficiente
- `forkJoin` evita múltiples llamadas secuenciales
- Estilos inline en componente (no hay archivo .scss separado)
