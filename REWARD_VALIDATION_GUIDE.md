# Guía de Validación de Reward Types - Frontend y Backend

## 📋 Análisis de Escenarios de Reward

### 1️⃣ NONE (Solo Promoción)
**Propósito**: Campaña promocional sin beneficio económico (ej: anuncio de evento, lanzamiento de producto)

**Frontend - Campos UI**:
- ✅ No se muestran campos adicionales
- ✅ Descripción se auto-rellena: "Sin beneficio - Solo promoción"
- ✅ No se validan campos de beneficio

**Payload enviado al Backend**:
```json
{
  "reward": null
}
```
O simplemente se omite el campo `reward` del payload.

**Backend - Validación esperada**:
- Si `reward` es `null` o no existe → Campaña sin beneficio económico
- No crear registro en tabla `promotion_rewards`

---

### 2️⃣ PERCENT_DISCOUNT (Descuento Porcentual)
**Propósito**: Aplicar un porcentaje de descuento sobre el total de la compra

**Frontend - Campos UI**:
- ✅ `numericValue` (0-100%) - **REQUERIDO**
- ✅ `description` (max 500 chars) - **REQUERIDO**
- ⭕ `minPurchaseAmount` (opcional)
- ⭕ `usageLimit` (opcional)

**Payload enviado al Backend**:
```json
{
  "reward": {
    "rewardType": "PERCENT_DISCOUNT",
    "numericValue": 20,
    "description": "20% de descuento en toda la tienda",
    "minPurchaseAmount": 500,
    "usageLimit": 100
  }
}
```

**Backend - Validación esperada**:
```java
if (reward.getRewardType() == RewardType.PERCENT_DISCOUNT) {
    // Validar numericValue
    if (reward.getNumericValue() == null || 
        reward.getNumericValue() < 0 || 
        reward.getNumericValue() > 100) {
        throw new ValidationException("numericValue debe estar entre 0 y 100 para PERCENT_DISCOUNT");
    }
    
    // Validar description
    if (reward.getDescription() == null || reward.getDescription().isEmpty()) {
        throw new ValidationException("description es requerida para PERCENT_DISCOUNT");
    }
    
    if (reward.getDescription().length() > 500) {
        throw new ValidationException("description no puede exceder 500 caracteres");
    }
}
```

---

### 3️⃣ FIXED_AMOUNT (Monto Fijo)
**Propósito**: Descontar un monto fijo en pesos del total de la compra

**Frontend - Campos UI**:
- ✅ `numericValue` (monto en $) - **REQUERIDO**
- ✅ `description` (max 500 chars) - **REQUERIDO**
- ⭕ `minPurchaseAmount` (opcional)
- ⭕ `usageLimit` (opcional)

**Payload enviado al Backend**:
```json
{
  "reward": {
    "rewardType": "FIXED_AMOUNT",
    "numericValue": 50,
    "description": "$50 de descuento en tu compra",
    "minPurchaseAmount": 200,
    "usageLimit": 50
  }
}
```

**Backend - Validación esperada**:
```java
if (reward.getRewardType() == RewardType.FIXED_AMOUNT) {
    // Validar numericValue
    if (reward.getNumericValue() == null || reward.getNumericValue() <= 0) {
        throw new ValidationException("numericValue debe ser mayor a 0 para FIXED_AMOUNT");
    }
    
    // Validar description
    if (reward.getDescription() == null || reward.getDescription().isEmpty()) {
        throw new ValidationException("description es requerida para FIXED_AMOUNT");
    }
    
    if (reward.getDescription().length() > 500) {
        throw new ValidationException("description no puede exceder 500 caracteres");
    }
}
```

---

### 4️⃣ FREE_PRODUCT (Producto Gratis)
**Propósito**: Regalar un producto específico del catálogo

**Frontend - Campos UI**:
- ✅ `productId` (selección de TreeSelect) - **REQUERIDO**
- ✅ `description` (max 500 chars) - **REQUERIDO**
- ⭕ `minPurchaseAmount` (opcional)
- ⭕ `usageLimit` (opcional)

**Payload enviado al Backend**:
```json
{
  "reward": {
    "rewardType": "FREE_PRODUCT",
    "productId": 102,
    "description": "Latte gratis con tu compra",
    "minPurchaseAmount": 100,
    "usageLimit": 200
  }
}
```

**⚠️ IMPORTANTE - Manejo de productId**:

El `productId` viene del componente `p-treeSelect` de PrimeNG. El frontend ya maneja la conversión a número:

```typescript
// reward-form.component.ts - onProductTreeSelect()
onProductTreeSelect(event: any): void {
  let val = event;
  if (event && typeof event === 'object') {
    val = event.value !== undefined ? event.value : event;
  }
  
  const productId = typeof val === 'number' ? val : Number(val);
  
  if (!isNaN(productId) && productId > 0) {
    this.rewardForm.get('productId')?.setValue(productId);
  } else {
    this.rewardForm.get('productId')?.setValue(null);
  }
}
```

**Backend - Validación esperada**:
```java
if (reward.getRewardType() == RewardType.FREE_PRODUCT) {
    // Validar productId
    if (reward.getProductId() == null || reward.getProductId() <= 0) {
        throw new ValidationException("productId es requerido y debe ser mayor a 0 para FREE_PRODUCT");
    }
    
    // Verificar que el producto exista en el catálogo
    Product product = productRepository.findById(reward.getProductId())
        .orElseThrow(() -> new ValidationException(
            "Producto con ID " + reward.getProductId() + " no existe en el catálogo"
        ));
    
    // Validar description
    if (reward.getDescription() == null || reward.getDescription().isEmpty()) {
        throw new ValidationException("description es requerida para FREE_PRODUCT");
    }
    
    if (reward.getDescription().length() > 500) {
        throw new ValidationException("description no puede exceder 500 caracteres");
    }
}
```

---

### 5️⃣ BUY_X_GET_Y (Compra X Lleva Y)
**Propósito**: Promoción tipo "Compra 2 lleva 1 gratis"

**Frontend - Campos UI**:
- ✅ `buyQuantity` (cantidad a comprar) - **REQUERIDO**
- ✅ `freeQuantity` (cantidad gratis) - **REQUERIDO**
- ✅ `description` (max 500 chars) - **REQUERIDO**
- ⭕ `minPurchaseAmount` (opcional)
- ⭕ `usageLimit` (opcional)

**Payload enviado al Backend**:
```json
{
  "reward": {
    "rewardType": "BUY_X_GET_Y",
    "buyQuantity": 2,
    "freeQuantity": 1,
    "description": "Compra 2 cafés y lleva 1 gratis",
    "minPurchaseAmount": 0,
    "usageLimit": 300
  }
}
```

**Backend - Validación esperada**:
```java
if (reward.getRewardType() == RewardType.BUY_X_GET_Y) {
    // Validar buyQuantity
    if (reward.getBuyQuantity() == null || reward.getBuyQuantity() < 1) {
        throw new ValidationException("buyQuantity debe ser al menos 1 para BUY_X_GET_Y");
    }
    
    // Validar freeQuantity
    if (reward.getFreeQuantity() == null || reward.getFreeQuantity() < 1) {
        throw new ValidationException("freeQuantity debe ser al menos 1 para BUY_X_GET_Y");
    }
    
    // Validar description
    if (reward.getDescription() == null || reward.getDescription().isEmpty()) {
        throw new ValidationException("description es requerida para BUY_X_GET_Y");
    }
    
    if (reward.getDescription().length() > 500) {
        throw new ValidationException("description no puede exceder 500 caracteres");
    }
}
```

---

## 🔧 Recomendaciones para el Backend

### 1. Endpoint GET de productos/categorías
**Problema actual**: El TreeSelect necesita cargar productos con su ID numérico.

**Solución recomendada**:

```java
// ProductController.java o CatalogController.java

@GetMapping("/api/tenants/{tenantId}/catalog/tree")
public ResponseEntity<List<CategoryTreeNode>> getCatalogTree(@PathVariable Long tenantId) {
    List<CategoryTreeNode> tree = catalogService.getCategoryTreeWithProducts(tenantId);
    return ResponseEntity.ok(tree);
}

// CategoryTreeNode.java (DTO)
public class CategoryTreeNode {
    private String label;      // "Bebidas"
    private String key;        // "cat-1" (no seleccionable)
    private boolean selectable; // false para categorías
    private List<ProductNode> children;
}

public class ProductNode {
    private String label;      // "Café Americano"
    private Long key;          // 102 ⚠️ DEBE SER NUMBER, no String
    private boolean selectable; // true para productos
}
```

**⚠️ CRÍTICO**: El campo `key` de los productos **DEBE** ser numérico (`Long` o `Integer`), no `String`.

Si actualmente retornas:
```json
{
  "label": "Café Americano",
  "key": "102",  // ❌ String
  "selectable": true
}
```

Cambiar a:
```json
{
  "label": "Café Americano",
  "key": 102,  // ✅ Number
  "selectable": true
}
```

### 2. Validación centralizada de rewards

Crear un servicio validador:

```java
@Service
public class RewardValidationService {
    
    public void validateReward(ConfigureRewardRequest reward) {
        if (reward == null) {
            return; // Campaña sin reward es válida
        }
        
        switch (reward.getRewardType()) {
            case NONE:
                // No validar campos adicionales
                break;
                
            case PERCENT_DISCOUNT:
                validatePercentDiscount(reward);
                break;
                
            case FIXED_AMOUNT:
                validateFixedAmount(reward);
                break;
                
            case FREE_PRODUCT:
                validateFreeProduct(reward);
                break;
                
            case BUY_X_GET_Y:
                validateBuyXGetY(reward);
                break;
                
            case CUSTOM:
                validateCustom(reward);
                break;
        }
    }
    
    private void validatePercentDiscount(ConfigureRewardRequest reward) {
        if (reward.getNumericValue() == null || 
            reward.getNumericValue() < 0 || 
            reward.getNumericValue() > 100) {
            throw new ValidationException(
                "numericValue debe estar entre 0 y 100 para PERCENT_DISCOUNT"
            );
        }
        validateDescription(reward.getDescription());
    }
    
    private void validateFixedAmount(ConfigureRewardRequest reward) {
        if (reward.getNumericValue() == null || reward.getNumericValue() <= 0) {
            throw new ValidationException(
                "numericValue debe ser mayor a 0 para FIXED_AMOUNT"
            );
        }
        validateDescription(reward.getDescription());
    }
    
    private void validateFreeProduct(ConfigureRewardRequest reward) {
        if (reward.getProductId() == null || reward.getProductId() <= 0) {
            throw new ValidationException(
                "productId es requerido y debe ser mayor a 0 para FREE_PRODUCT"
            );
        }
        
        // Verificar que el producto exista
        if (!productRepository.existsById(reward.getProductId())) {
            throw new ValidationException(
                "Producto con ID " + reward.getProductId() + " no existe"
            );
        }
        
        validateDescription(reward.getDescription());
    }
    
    private void validateBuyXGetY(ConfigureRewardRequest reward) {
        if (reward.getBuyQuantity() == null || reward.getBuyQuantity() < 1) {
            throw new ValidationException(
                "buyQuantity debe ser al menos 1 para BUY_X_GET_Y"
            );
        }
        
        if (reward.getFreeQuantity() == null || reward.getFreeQuantity() < 1) {
            throw new ValidationException(
                "freeQuantity debe ser al menos 1 para BUY_X_GET_Y"
            );
        }
        
        validateDescription(reward.getDescription());
    }
    
    private void validateDescription(String description) {
        if (description == null || description.trim().isEmpty()) {
            throw new ValidationException("description es requerida");
        }
        
        if (description.length() > 500) {
            throw new ValidationException(
                "description no puede exceder 500 caracteres"
            );
        }
    }
}
```

### 3. Uso en el controlador

```java
@RestController
@RequestMapping("/api/campaigns")
public class CampaignController {
    
    @Autowired
    private RewardValidationService rewardValidationService;
    
    @PutMapping("/{id}")
    public ResponseEntity<CampaignResponse> updateCampaign(
            @PathVariable Long id,
            @RequestBody UpdateCampaignRequest request) {
        
        // Validar reward si existe
        if (request.getReward() != null) {
            rewardValidationService.validateReward(request.getReward());
        }
        
        // Actualizar campaña y reward en una sola transacción
        CampaignResponse response = campaignService.updateCampaignWithReward(id, request);
        
        return ResponseEntity.ok(response);
    }
}
```

---

## 📊 Tabla Resumen de Campos por Tipo

| Reward Type | numericValue | productId | buyQuantity | freeQuantity | description | minPurchaseAmount | usageLimit |
|-------------|--------------|-----------|-------------|--------------|-------------|-------------------|------------|
| NONE | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| PERCENT_DISCOUNT | ✅ (0-100) | ❌ | ❌ | ❌ | ✅ | ⭕ | ⭕ |
| FIXED_AMOUNT | ✅ (> 0) | ❌ | ❌ | ❌ | ✅ | ⭕ | ⭕ |
| FREE_PRODUCT | ❌ | ✅ (> 0) | ❌ | ❌ | ✅ | ⭕ | ⭕ |
| BUY_X_GET_Y | ❌ | ❌ | ✅ (≥ 1) | ✅ (≥ 1) | ✅ | ⭕ | ⭕ |
| CUSTOM | ❌ | ❌ | ❌ | ❌ | ✅ | ⭕ | ⭕ |

**Leyenda**:
- ✅ = Campo requerido
- ⭕ = Campo opcional
- ❌ = Campo no usado / ignorado

---

## 🚀 Testing - Casos de Prueba

### Test 1: PERCENT_DISCOUNT
```bash
curl -X PUT http://localhost:8080/api/campaigns/38 \
-H "Content-Type: application/json" \
-d '{
  "title": "Descuento Verano",
  "status": "ACTIVE",
  "reward": {
    "rewardType": "PERCENT_DISCOUNT",
    "numericValue": 25,
    "description": "25% de descuento en toda la tienda",
    "minPurchaseAmount": 500,
    "usageLimit": 100
  }
}'
```

**Respuesta esperada**: 200 OK con reward actualizado

### Test 2: FREE_PRODUCT
```bash
curl -X PUT http://localhost:8080/api/campaigns/38 \
-H "Content-Type: application/json" \
-d '{
  "title": "Café Gratis",
  "status": "ACTIVE",
  "reward": {
    "rewardType": "FREE_PRODUCT",
    "productId": 102,
    "description": "Latte gratis con tu compra",
    "minPurchaseAmount": 100,
    "usageLimit": 50
  }
}'
```

**Respuesta esperada**: 200 OK con productId guardado como número

### Test 3: Validación de productId inválido
```bash
curl -X PUT http://localhost:8080/api/campaigns/38 \
-H "Content-Type: application/json" \
-d '{
  "reward": {
    "rewardType": "FREE_PRODUCT",
    "productId": 99999,
    "description": "Producto inexistente"
  }
}'
```

**Respuesta esperada**: 400 Bad Request
```json
{
  "code": 400,
  "message": "Producto con ID 99999 no existe"
}
```

---

## 🎯 Checklist Backend

- [ ] El endpoint GET `/api/tenants/{tenantId}/catalog/tree` retorna `key` como número (Long/Integer)
- [ ] El campo `productId` en la entidad `PromotionReward` es de tipo `Long` o `Integer`
- [ ] Se valida que `productId` exista en la tabla de productos antes de guardar
- [ ] Se valida `numericValue` según el tipo de reward (0-100 para PERCENT_DISCOUNT, > 0 para FIXED_AMOUNT)
- [ ] Se valida que `description` no exceda 500 caracteres
- [ ] Se valida que `description` sea requerida para todos los tipos excepto NONE
- [ ] Se retorna el reward completo en la respuesta del PUT
- [ ] Se manejan errores de validación con códigos HTTP apropiados (400 Bad Request)
- [ ] Se implementa validación en una sola transacción para campaña + reward

---

## 📝 Notas Finales

1. **Conversión automática en Frontend**: El frontend ya maneja la conversión de `selectedProductKey` (string del TreeSelect) a `productId` (number) antes de enviar al backend.

2. **Logs de depuración**: Agregué console.logs en el frontend para facilitar el debugging:
   - `[RewardForm] Product selected - ID: 102`
   - `[RewardForm] FREE_PRODUCT - productId: 102`
   - `[RewardForm] Final ConfigureRewardRequest: {...}`

3. **Validación de formulario**: El frontend valida que todos los campos requeridos estén completos antes de permitir guardar.

4. **Campos opcionales**: `minPurchaseAmount` y `usageLimit` son siempre opcionales y se envían solo si tienen valor.

---

**Última actualización**: 2026-01-17  
**Versión**: 1.0
