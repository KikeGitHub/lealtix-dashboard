# RewardFormComponent - Documentación de Integración

## Descripción
Componente standalone para crear y editar rewards (beneficios) de campañas en Angular 20 con PrimeNG 20.

## Archivos Creados

### 1. Enum RewardType
**Archivo:** `src/app/models/enums.ts`
- Se agregó el enum `RewardType` con los valores:
  - PERCENT_DISCOUNT
  - FIXED_AMOUNT
  - FREE_PRODUCT
  - BUY_X_GET_Y
  - CUSTOM

### 2. Modelo de Reward
**Archivo:** `src/app/pages/campaigns/models/reward.model.ts`
- `CreateRewardRequest`: Interface para crear rewards
- `RewardResponse`: Interface para respuestas del backend

### 3. Servicio Actualizado
**Archivo:** `src/app/pages/campaigns/services/campaign.service.ts`
- Método agregado: `createReward(campaignId: number, req: CreateRewardRequest): Observable<RewardResponse>`
- Endpoint: `POST /api/campaigns/{campaignId}/reward`

### 4. Componente RewardForm
**Archivos:**
- `src/app/pages/campaigns/components/reward-form/reward-form.component.ts`
- `src/app/pages/campaigns/components/reward-form/reward-form.component.html`
- `src/app/pages/campaigns/components/reward-form/reward-form.component.scss`

## Características

### Formularios Reactivos
- Uso de `ReactiveFormsModule` con validaciones dinámicas
- Validaciones específicas según el tipo de reward seleccionado

### Componentes PrimeNG Utilizados
- `p-dropdown`: Selector de tipo de reward
- `p-inputNumber`: Campos numéricos (porcentaje, monto, cantidades, IDs)
- `textarea[pInputTextarea]`: Descripción del reward
- `p-button`: Botones de acción (Guardar/Cancelar)

### Validaciones Dinámicas

#### PERCENT_DISCOUNT
- `numericValue`: Requerido, min: 0, max: 100

#### FIXED_AMOUNT
- `numericValue`: Requerido, min: 0

#### FREE_PRODUCT
- `productId`: Requerido

#### BUY_X_GET_Y
- `buyQuantity`: Requerido, min: 1
- `freeQuantity`: Requerido, min: 1

#### CUSTOM
- `description`: Requerido

### Campos Opcionales (para todos los tipos)
- `description`: Descripción del beneficio
- `minPurchaseAmount`: Monto mínimo de compra
- `usageLimit`: Límite de usos

## Integración en tu Aplicación

### Opción 1: Uso en una página existente

```typescript
import { Component } from '@angular/core';
import { RewardFormComponent } from './pages/campaigns/components/reward-form/reward-form.component';

@Component({
  selector: 'app-campaign-edit',
  standalone: true,
  imports: [RewardFormComponent],
  template: `
    <div class="campaign-edit-container">
      <h2>Editar Campaña</h2>
      
      <!-- Otros campos de la campaña -->
      
      <h3>Configurar Beneficio</h3>
      <app-reward-form [campaignId]="campaignId"></app-reward-form>
    </div>
  `
})
export class CampaignEditComponent {
  campaignId = 123; // ID de la campaña a editar
}
```

### Opción 2: Uso en un Dialog/Modal

```typescript
import { Component } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { RewardFormComponent } from './pages/campaigns/components/reward-form/reward-form.component';

@Component({
  selector: 'app-campaign-rewards',
  standalone: true,
  imports: [DialogModule, RewardFormComponent],
  template: `
    <p-button (onClick)="showDialog = true" label="Agregar Beneficio"></p-button>
    
    <p-dialog 
      [(visible)]="showDialog" 
      [header]="'Configurar Beneficio de Campaña'"
      [modal]="true"
      [style]="{width: '50vw'}"
    >
      <app-reward-form [campaignId]="campaignId"></app-reward-form>
    </p-dialog>
  `
})
export class CampaignRewardsComponent {
  campaignId = 123;
  showDialog = false;
}
```

### Opción 3: Uso en rutas

```typescript
// En app.routes.ts o similar
import { Routes } from '@angular/router';
import { RewardFormComponent } from './pages/campaigns/components/reward-form/reward-form.component';

export const routes: Routes = [
  {
    path: 'campaigns/:id/reward',
    component: RewardFormComponent
  }
];

// Para pasar el campaignId desde la ruta, modifica el componente:
// En reward-form.component.ts, agrega:
import { ActivatedRoute } from '@angular/router';

// En el constructor:
private route = inject(ActivatedRoute);

// En ngOnInit:
if (!this.campaignId) {
  this.campaignId = Number(this.route.snapshot.paramMap.get('id'));
}
```

## Manejo de Mensajes

El componente utiliza `MessageService` de PrimeNG. Asegúrate de tener configurado el Toast en tu aplicación:

```typescript
// En app.component.ts o layout principal
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ToastModule],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {}
```

## Dependencias Requeridas

El componente es standalone y ya incluye todas sus dependencias:
- `@angular/common` (CommonModule)
- `@angular/forms` (ReactiveFormsModule)
- `primeng/button`
- `primeng/dropdown`
- `primeng/inputnumber`
- `primeng/inputtext`
- `primeng/inputtextarea`
- `primeng/api` (MessageService)

## Versiones Utilizadas

- **Angular**: 20.x
- **PrimeNG**: 20.x
- **RxJS**: 7.8.x

## Comportamiento del Formulario

1. Al seleccionar un tipo de reward, se muestran dinámicamente los campos correspondientes
2. Las validaciones se aplican automáticamente según el tipo seleccionado
3. El botón "Guardar" se deshabilita si el formulario es inválido
4. Al enviar, se llama al backend con el endpoint correcto
5. Se muestra un mensaje de éxito o error según la respuesta
6. El formulario se resetea después de un envío exitoso

## Notas Importantes

- El componente NO activa la campaña, solo crea el reward
- El `campaignId` debe ser proporcionado como Input
- El componente es reutilizable y no tiene lógica hardcodeada
- Respeta los estilos de PrimeNG sin CSS custom innecesario
- Usa TypeScript estricto con tipado completo

## Personalización

Si necesitas personalizar el comportamiento:

### Agregar un evento de éxito
```typescript
// En reward-form.component.ts
@Output() rewardCreated = new EventEmitter<RewardResponse>();

// En onSubmit(), después del success:
this.rewardCreated.emit(response);
```

### Cargar un reward existente para edición
```typescript
@Input() existingReward?: RewardResponse;

ngOnInit(): void {
  this.initForm();
  if (this.existingReward) {
    this.loadExistingReward(this.existingReward);
  }
  this.setupFormListeners();
}

private loadExistingReward(reward: RewardResponse): void {
  this.rewardForm.patchValue(reward);
}
```

## Soporte

Para cualquier duda o problema con la integración, revisa:
1. La consola del navegador para errores
2. Los logs del servicio (están configurados en CampaignService)
3. La configuración del MessageService en tu app
