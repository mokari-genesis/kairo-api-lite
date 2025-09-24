# Servicio Métodos de Pago Unificado

Este servicio proporciona acceso a la vista `vista_metodos_pago_unificado` de la base de datos con capacidades de filtrado avanzado y resúmenes estadísticos.

## Endpoints

### 1. GET /metodos-pago-unificado

Obtiene los datos detallados de la vista con filtros opcionales.

#### Parámetros de consulta:

- `empresa_id` (opcional): Filtrar por ID de empresa
- `venta_id` (opcional): Filtrar por ID de venta específica
- `cliente_id` (opcional): Filtrar por ID de cliente
- `usuario_id` (opcional): Filtrar por ID de usuario
- `metodo_pago_id` (opcional): Filtrar por ID de método de pago
- `moneda_id` (opcional): Filtrar por ID de moneda
- `estado_venta` (opcional): Filtrar por estado de venta
- `estado_pago` (opcional): Filtrar por estado de pago
- `fecha_venta_inicio` (opcional): Fecha de inicio para filtrar ventas (formato: YYYY-MM-DD)
- `fecha_venta_fin` (opcional): Fecha de fin para filtrar ventas (formato: YYYY-MM-DD)
- `fecha_pago_inicio` (opcional): Fecha de inicio para filtrar pagos (formato: YYYY-MM-DD)
- `fecha_pago_fin` (opcional): Fecha de fin para filtrar pagos (formato: YYYY-MM-DD)
- `venta_es_vendida` (opcional): Filtrar por ventas completadas (true/false)
- `limit` (opcional): Límite de registros (default: 100)
- `offset` (opcional): Offset para paginación (default: 0)

#### Ejemplo de uso:

```
GET /metodos-pago-unificado?empresa_id=1&fecha_venta_inicio=2024-01-01&fecha_venta_fin=2024-01-31&limit=50
```

### 2. GET /metodos-pago-unificado/resumen

Obtiene un resumen estadístico de los datos agrupados por diferentes criterios.

#### Parámetros de consulta:

Todos los parámetros de filtro del endpoint anterior, más:

- `agrupar_por` (opcional): Criterio de agrupación (default: 'metodo_pago')
  - `metodo_pago`: Agrupar por método de pago
  - `cliente`: Agrupar por cliente
  - `usuario`: Agrupar por usuario
  - `moneda`: Agrupar por moneda
  - `fecha_venta_dia`: Agrupar por día de venta
  - `fecha_pago_dia`: Agrupar por día de pago

#### Ejemplo de uso:

```
GET /metodos-pago-unificado/resumen?empresa_id=1&agrupar_por=cliente&fecha_venta_inicio=2024-01-01
```

## Estructura de datos

### Vista principal (vista_metodos_pago_unificado)

La vista incluye los siguientes campos:

- **Información de empresa**: `empresa_id`, `empresa_nombre`
- **Información de venta**: `venta_id`, `fecha_venta`, `fecha_venta_dia`, `estado_venta`, `estado_pago`, `total_venta`, `comentario_venta`
- **Información de moneda**: `moneda_id`, `moneda_codigo`, `moneda_nombre`, `moneda_simbolo`
- **Información de cliente**: `cliente_id`, `cliente_nombre`
- **Información de usuario**: `usuario_id`, `usuario_nombre`
- **Información de pago**: `pago_id`, `metodo_pago_id`, `metodo_pago`, `monto_pago`, `referencia_pago`, `fecha_pago`, `fecha_pago_dia`
- **Cálculos agregados**:
  - `total_pagado_venta`: Suma total pagada por venta
  - `cantidad_pagos_venta`: Cantidad de pagos por venta
  - `total_por_metodo_en_venta`: Total pagado por método de pago en la venta
  - `saldo_pendiente_venta`: Saldo pendiente de pago
  - `venta_es_vendida_bool`: Indica si la venta está completada

### Resumen estadístico

El endpoint de resumen proporciona:

- `total_ventas`: Número total de ventas
- `total_pagos`: Número total de pagos
- `total_monto_pagado`: Suma total de montos pagados
- `promedio_monto_pago`: Promedio de monto por pago
- `monto_minimo`: Monto mínimo de pago
- `monto_maximo`: Monto máximo de pago
- `total_ventas_monto`: Suma total de montos de ventas
- `promedio_venta`: Promedio de monto por venta
- `total_saldo_pendiente`: Suma total de saldos pendientes
- `ventas_completadas`: Número de ventas completadas
- `ventas_pendientes`: Número de ventas pendientes

## Casos de uso

1. **Reporte de ventas por método de pago**: Filtrar por empresa y rango de fechas
2. **Análisis de pagos por cliente**: Agrupar por cliente para ver patrones de pago
3. **Seguimiento de saldos pendientes**: Filtrar ventas con saldo pendiente
4. **Análisis temporal**: Agrupar por día para ver tendencias
5. **Reporte de rendimiento por usuario**: Agrupar por usuario para análisis de ventas

## Consideraciones de rendimiento

- El servicio incluye paginación para manejar grandes volúmenes de datos
- Los filtros de fecha utilizan índices en las columnas de fecha
- Se recomienda usar filtros específicos para mejorar el rendimiento
- El límite por defecto es de 100 registros para evitar timeouts
