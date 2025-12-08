# CreateCampaignComponent

Componente de pantalla completa para crear campañas promocionales.

## Características

### Layout
- **Pantalla dividida**: 60% formulario (izquierda) / 40% vista previa (derecha)
- **Responsive**: Se adapta a dispositivos móviles apilando las columnas
- **Vista previa en tiempo real**: Actualiza conforme el usuario llena el formulario

### Funcionalidades

1. **Formulario completo**:
   - Información básica (título, subtítulo, descripción)
   - Carga de imagen (FileUpload) o URL
   - Detalles de promoción (tipo, valor)
   - Período de vigencia (fechas inicio/fin)
   - Call-to-Action personalizable
   - Canales de distribución
   - Segmentación de audiencia
   - Activación automática

2. **Acciones**:
   - Guardar campaña
   - Guardar como borrador
   - Vista previa ampliada (modal)
   - Regresar al listado

3. **Integración con plantillas**:
   - Recibe `templateId` como query parameter
   - Pre-llena el formulario con datos de la plantilla

## Uso

### Navegación desde código

```typescript
// Crear campaña sin plantilla
this.router.navigate(['/campaigns/create']);

// Crear campaña con plantilla
this.router.navigate(['/campaigns/create'], {
  queryParams: { templateId: 123 }
});
```

### Navegación desde template

```html
<!-- Botón sin plantilla -->
<p-button 
  label="Nueva Campaña"
  routerLink="/campaigns/create">
</p-button>

<!-- Desde lista de plantillas -->
<p-button 
  label="Usar Plantilla"
  [routerLink]="['/campaigns/create']"
  [queryParams]="{ templateId: template.id }">
</p-button>
```

## Archivos

- `create-campaign.component.ts` - Lógica del componente
- `create-campaign.component.html` - Template HTML
- `create-campaign.component.scss` - Estilos SCSS
- `create-campaign.models.ts` - Interfaces TypeScript

## Ruta

```
/campaigns/create?templateId={id}
```

## Dependencias PrimeNG

- ButtonModule
- CardModule
- InputTextModule
- TextareaModule
- SelectModule
- DatePickerModule
- FileUploadModule
- CheckboxModule
- DividerModule
- ChipModule
- DialogModule
- ToastModule

## Estilos

El componente utiliza:
- Variables CSS de PrimeNG
- PrimeFlex para layout grid
- Estilos custom en SCSS para preview
- Responsive breakpoints: 991px (lg), 768px (md), 576px (sm)

## TODO

- [ ] Integrar servicio de carga de imágenes (Cloudinary)
- [ ] Obtener businessId desde servicio de autenticación
- [ ] Implementar campos dinámicos basados en template.fields
- [ ] Añadir validaciones personalizadas de fechas
- [ ] Guardar borradores con estado DRAFT
