# Ejemplos de Uso - Servicio Métodos de Pago Unificado

## Ejemplos de consultas básicas

### 1. Obtener todos los métodos de pago de una empresa

```bash
GET /metodos-pago-unificado?empresa_id=1
```

### 2. Filtrar por rango de fechas de venta

```bash
GET /metodos-pago-unificado?empresa_id=1&fecha_venta_inicio=2024-01-01&fecha_venta_fin=2024-01-31
```

### 3. Filtrar por método de pago específico

```bash
GET /metodos-pago-unificado?empresa_id=1&metodo_pago_id=2
```

### 4. Filtrar ventas completadas

```bash
GET /metodos-pago-unificado?empresa_id=1&venta_es_vendida=true
```

### 5. Filtrar por cliente específico

```bash
GET /metodos-pago-unificado?empresa_id=1&cliente_id=123
```

## Ejemplos de consultas avanzadas

### 6. Ventas con saldo pendiente en un rango de fechas

```bash
GET /metodos-pago-unificado?empresa_id=1&fecha_venta_inicio=2024-01-01&fecha_venta_fin=2024-01-31&estado_pago=pending
```

### 7. Pagos realizados en una fecha específica

```bash
GET /metodos-pago-unificado?empresa_id=1&fecha_pago_inicio=2024-01-15&fecha_pago_fin=2024-01-15
```

### 8. Ventas de un usuario específico con paginación

```bash
GET /metodos-pago-unificado?empresa_id=1&usuario_id=456&limit=50&offset=0
```

### 9. Ventas en una moneda específica

```bash
GET /metodos-pago-unificado?empresa_id=1&moneda_id=1
```

## Ejemplos de resúmenes estadísticos

### 10. Resumen por método de pago

```bash
GET /metodos-pago-unificado/resumen?empresa_id=1&agrupar_por=metodo_pago
```

### 11. Resumen por cliente

```bash
GET /metodos-pago-unificado/resumen?empresa_id=1&agrupar_por=cliente&fecha_venta_inicio=2024-01-01
```

### 12. Resumen por día de venta

```bash
GET /metodos-pago-unificado/resumen?empresa_id=1&agrupar_por=fecha_venta_dia&fecha_venta_inicio=2024-01-01&fecha_venta_fin=2024-01-31
```

### 13. Resumen por usuario

```bash
GET /metodos-pago-unificado/resumen?empresa_id=1&agrupar_por=usuario&fecha_venta_inicio=2024-01-01
```

### 14. Resumen por moneda

```bash
GET /metodos-pago-unificado/resumen?empresa_id=1&agrupar_por=moneda
```

## Ejemplos de casos de uso específicos

### 15. Reporte de ventas del mes actual

```bash
GET /metodos-pago-unificado?empresa_id=1&fecha_venta_inicio=2024-01-01&fecha_venta_fin=2024-01-31
```

### 16. Análisis de pagos por día

```bash
GET /metodos-pago-unificado/resumen?empresa_id=1&agrupar_por=fecha_pago_dia&fecha_pago_inicio=2024-01-01&fecha_pago_fin=2024-01-31
```

### 17. Ventas pendientes de pago

```bash
GET /metodos-pago-unificado?empresa_id=1&estado_pago=pending
```

### 18. Resumen de rendimiento por usuario

```bash
GET /metodos-pago-unificado/resumen?empresa_id=1&agrupar_por=usuario&fecha_venta_inicio=2024-01-01&fecha_venta_fin=2024-01-31
```

### 19. Análisis de métodos de pago más utilizados

```bash
GET /metodos-pago-unificado/resumen?empresa_id=1&agrupar_por=metodo_pago&fecha_venta_inicio=2024-01-01&fecha_venta_fin=2024-01-31
```

### 20. Ventas con pagos múltiples

```bash
GET /metodos-pago-unificado?empresa_id=1&fecha_venta_inicio=2024-01-01&fecha_venta_fin=2024-01-31
# Luego filtrar en el cliente por cantidad_pagos_venta > 1
```

## Ejemplos de respuesta

### Respuesta del endpoint principal

```json
{
  "statusCode": 200,
  "data": [
    {
      "empresa_id": 1,
      "empresa_nombre": "Mi Empresa",
      "venta_id": 123,
      "fecha_venta": "2024-01-15T10:30:00.000Z",
      "fecha_venta_dia": "2024-01-15",
      "estado_venta": "vendido",
      "estado_pago": "pagado",
      "total_venta": 1000.0,
      "moneda_id": 1,
      "moneda_codigo": "USD",
      "moneda_nombre": "Dólar Americano",
      "moneda_simbolo": "$",
      "comentario_venta": "Venta de prueba",
      "cliente_id": 456,
      "cliente_nombre": "Cliente Ejemplo",
      "usuario_id": 789,
      "usuario_nombre": "Vendedor Ejemplo",
      "pago_id": 101,
      "metodo_pago_id": 2,
      "metodo_pago": "Tarjeta de Crédito",
      "monto_pago": 500.0,
      "referencia_pago": "TXN123456",
      "fecha_pago": "2024-01-15T11:00:00.000Z",
      "fecha_pago_dia": "2024-01-15",
      "total_pagado_venta": 1000.0,
      "cantidad_pagos_venta": 2,
      "total_por_metodo_en_venta": 500.0,
      "saldo_pendiente_venta": 0.0,
      "venta_es_vendida_bool": 1
    }
  ],
  "msg": "Done",
  "status": "SUCCESS"
}
```

### Respuesta del endpoint de resumen

```json
{
  "statusCode": 200,
  "data": [
    {
      "metodo_pago_id": 2,
      "metodo_pago": "Tarjeta de Crédito",
      "grupo_nombre": null,
      "total_ventas": 15,
      "total_pagos": 15,
      "total_monto_pagado": 7500.0,
      "promedio_monto_pago": 500.0,
      "monto_minimo": 100.0,
      "monto_maximo": 1000.0,
      "total_ventas_monto": 7500.0,
      "promedio_venta": 500.0,
      "total_saldo_pendiente": 0.0,
      "ventas_completadas": 15,
      "ventas_pendientes": 0
    }
  ],
  "msg": "Done",
  "status": "SUCCESS"
}
```

## Notas importantes

1. **Paginación**: Usar `limit` y `offset` para manejar grandes volúmenes de datos
2. **Fechas**: Usar formato YYYY-MM-DD para los filtros de fecha
3. **Rendimiento**: Los filtros de fecha utilizan índices para mejor rendimiento
4. **Agrupación**: El parámetro `agrupar_por` afecta los campos devueltos en el resumen
5. **Valores booleanos**: Usar `true`/`false` para el parámetro `venta_es_vendida`
