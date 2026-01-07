# Redención Manual de Cupones

## Descripción
Módulo que permite a los usuarios del dashboard (tenants) validar y redimir cupones de forma manual ingresando el código del cupón. Esta funcionalidad está diseñada para casos donde el cliente no puede usar el QR o necesita validación presencial en el establecimiento.

## Características

### ✅ Validación de Cupones
- Búsqueda de cupones por código
- Validación en tiempo real contra el backend
- Visualización completa de información del cupón
- Detección de cupones ya redimidos o expirados

### ✅ Redención Manual
- Proceso de redención con confirmación
- Información detallada del beneficio
- Registro de quién realizó la redención
- Confirmación visual de redención exitosa

### ✅ Manejo de Errores
- Mensajes claros de error para cupones no encontrados
- Validación de cupones expirados
- Alertas para cupones ya redimidos
- Reintentos fáciles ante errores

## Arquitectura

### Componentes
- **ManualRedemptionComponent**: Componente principal standalone
  - Maneja los estados de la interfaz
  - Controla el flujo de validación y redención
  - Gestiona mensajes de éxito/error

### Servicios Utilizados
- **RedemptionService**: 
  - `validateCouponByCode(code: string)`: Valida un cupón
  - `redeemCouponByCode(code: string, request: RedemptionRequest)`: Redime un cupón
- **AuthService**: Obtiene información del usuario y tenant actual

### Modelos
- **CouponValidationResponse**: Respuesta de validación
- **RedemptionRequest**: Request para redimir
- **RedemptionResponse**: Respuesta de redención
- **RedemptionChannel**: Enum con canales de redención (MANUAL, QR_WEB, etc.)

## Estados de la UI

1. **idle**: Estado inicial, muestra formulario de búsqueda
2. **validating**: Validando cupón en el backend
3. **valid**: Cupón válido, muestra información y botón de redimir
4. **redeeming**: Procesando redención
5. **success**: Redención exitosa
6. **error**: Error en validación o redención

## Endpoints API

### Validar Cupón
```
GET /api/redemptions/validate/code/{code}?tenantId={tenantId}
```

**Respuesta:**
```json
{
  "valid": true,
  "message": "Cupón válido",
  "couponCode": "ABC123",
  "status": "ACTIVE",
  "expiresAt": "2024-12-31T23:59:59",
  "campaignTitle": "Campaña Navidad",
  "benefit": "20% de descuento",
  "customerName": "Juan Pérez",
  "customerEmail": "juan@email.com"
}
```

### Redimir Cupón
```
POST /api/redemptions/redeem/code/{code}?tenantId={tenantId}
```

**Body:**
```json
{
  "redeemedBy": "staff@tenant.com",
  "channel": "MANUAL",
  "location": "Dashboard Admin",
  "metadata": "{...}",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Cupón redimido exitosamente",
  "redemptionId": 123,
  "redeemedAt": "2024-12-15T10:30:00",
  "couponCode": "ABC123",
  "benefit": "20% de descuento",
  "customerName": "Juan Pérez"
}
```

## Flujo de Usuario

1. Usuario accede a "Redención" desde el menú
2. Ingresa el código del cupón
3. Click en "Validar Cupón"
4. Si es válido:
   - Se muestra información completa del cupón
   - Se muestra botón "Redimir Cupón"
5. Usuario confirma redención
6. Se procesa la redención
7. Se muestra confirmación de éxito
8. Opción para redimir otro cupón

## Diseño UX

### Principios Aplicados
- **Claridad**: Estados visuales claros y distintivos
- **Feedback**: Mensajes informativos en cada acción
- **Prevención de errores**: Confirmación antes de redimir
- **Eficiencia**: Flujo optimizado con mínimos clicks
- **Recuperación**: Fácil reinicio del proceso

### Paleta de Colores
- **Primario**: Gradiente púrpura (#667eea → #764ba2)
- **Éxito**: Verde (#10b981)
- **Error**: Rojo (#ef4444)
- **Advertencia**: Amarillo (#f59e0b)
- **Info**: Azul (#3b82f6)

### Componentes PrimeNG
- Card
- InputText
- Button
- Tag
- Message
- ProgressSpinner
- Toast
- ConfirmDialog
- Divider

## Navegación

**Ruta**: `/dashboard/manual-redemption`

**Menú**: Home → Redención (después de Plantillas)

## Responsive Design

- Diseño móvil optimizado
- Grid adaptativo para información
- Botones full-width en móvil
- Tipografía escalable

## Mensajes de Usuario

### Éxito
- ✅ "Cupón válido y listo para redimir"
- ✅ "¡Cupón redimido exitosamente!"

### Advertencias
- ⚠️ "Este cupón ya fue redimido anteriormente"
- ⚠️ "Este cupón ha expirado y no puede ser redimido"

### Errores
- ❌ "Cupón no encontrado"
- ❌ "Error al validar el cupón"
- ❌ "Error al redimir el cupón"

## Seguridad

- Autenticación requerida (AuthGuard)
- TenantId extraído del usuario autenticado
- Validación de permisos en backend
- No se puede redimir dos veces el mismo cupón

## Testing

### Casos de Prueba Sugeridos
1. Validar cupón válido y activo
2. Validar cupón no existente
3. Validar cupón ya redimido
4. Validar cupón expirado
5. Redimir cupón válido
6. Cancelar proceso de redención
7. Redimir otro cupón después de éxito
8. Manejo de errores de red

## Futuras Mejoras
- [ ] Escaneo QR integrado con cámara
- [ ] Historial de redenciones del día
- [ ] Búsqueda por nombre de cliente
- [ ] Exportar reporte de redenciones
- [ ] Modo offline con sincronización
