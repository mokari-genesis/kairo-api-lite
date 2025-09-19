# Migration Summary: Multiple Payments per Sale

## Overview

This migration adds support for multiple payments per sale (ventas_pagos) and reflects it in endpoints and reports, maintaining the current repository style.

## Database Schema Requirements

### Required Table: `ventas_pagos`

```sql
CREATE TABLE ventas_pagos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  venta_id INT NOT NULL,
  metodo_pago_id INT NOT NULL,
  moneda_id INT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  referencia_pago VARCHAR(255) NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venta_id) REFERENCES ventas(id),
  FOREIGN KEY (metodo_pago_id) REFERENCES metodos_pago(id),
  FOREIGN KEY (moneda_id) REFERENCES monedas(id)
);
```

### Required Views Updates

The following views need to be updated to handle multiple payments:

1. **vista_ventas_completas**: Add payment information
2. **vista_ventas_detalle_anidado**: Add payment information
3. **reporte_inventario_con_metodo**: Update to handle multiple payments

### Example View Updates

```sql
-- Update vista_ventas_completas to include payment info
ALTER VIEW vista_ventas_completas AS
SELECT
  v.*,
  (SELECT IFNULL(SUM(vp.monto),0) FROM ventas_pagos vp WHERE vp.venta_id = v.id) AS monto_pagado,
  (v.total - (SELECT IFNULL(SUM(vp.monto),0) FROM ventas_pagos vp WHERE vp.venta_id = v.id)) AS saldo
FROM ventas v
-- ... rest of existing view logic
```

## Changes Made

### 1. Common Database Utilities (`services/common/db.js`)

- ✅ Added `transaction()` function for database transaction support
- ✅ Maintains existing `fetchResultMysql()` functionality

### 2. Purchase Service Routes (`services/purchase/serverless.yml`)

- ✅ Added 4 new payment management routes:
  - `POST /purchase/{ventaId}/payments` - Create payment
  - `GET /purchase/{ventaId}/payments` - List payments
  - `PUT /purchase/{ventaId}/payments/{paymentId}` - Update payment
  - `DELETE /purchase/{ventaId}/payments/{paymentId}` - Delete payment

### 3. Purchase Storage Functions (`services/purchase/storage.js`)

- ✅ Added payment management functions:
  - `getVentaByIdWithPayments()` - Get sale with payment info
  - `getVentaPayments()` - Get all payments for a sale
  - `sumPagosByVenta()` - Calculate total payments for a sale
  - `createVentaPayment()` - Create single payment (with transaction)
  - `updateVentaPayment()` - Update single payment (with transaction)
  - `deleteVentaPayment()` - Delete single payment (with transaction)
  - `createVentaPayments()` - Create multiple payments (with transaction)
  - `getVentaWithPayments()` - Get sale with payment summary

### 4. Purchase Handlers (`services/purchase/handler.js`)

- ✅ Added 4 new payment handlers:
  - `createPayment` - Create payment for a sale
  - `listPayments` - List all payments for a sale
  - `updatePayment` - Update existing payment
  - `deletePayment` - Delete existing payment
- ✅ Updated existing handlers to support multiple payments:
  - `create` - Now accepts `pagos[]` array
  - `update` - Now accepts `pagos[]` array
  - `updateSale` - Now accepts `pagos[]` array
- ✅ Added validation for sold sales requiring payments
- ✅ Added validation that payment sum equals sale total for sold sales

### 5. Reports Service (`services/reportes/`)

- ✅ Added new report function `getReporteVentasConPagos()`
- ✅ Added new handler `reporteVentasConPagos`
- ✅ Added new route `GET /reportes/ventas-con-pagos`
- ✅ Report includes:
  - Sale information
  - Total paid amount (`monto_pagado`)
  - Remaining balance (`saldo`)
  - JSON array of all payments with details

## API Changes

### New Endpoints

1. **Create Payment**

   ```
   POST /purchase/{ventaId}/payments
   Body: {
     "metodo_pago_id": 1,
     "moneda_id": 1,
     "monto": 100.00,
     "referencia_pago": "REF123" // optional
   }
   ```

2. **List Payments**

   ```
   GET /purchase/{ventaId}/payments
   ```

3. **Update Payment**

   ```
   PUT /purchase/{ventaId}/payments/{paymentId}
   Body: {
     "metodo_pago_id": 2, // optional
     "moneda_id": 1, // optional
     "monto": 150.00, // optional
     "referencia_pago": "REF456" // optional
   }
   ```

4. **Delete Payment**

   ```
   DELETE /purchase/{ventaId}/payments/{paymentId}
   ```

5. **Sales Report with Payments**
   ```
   GET /reportes/ventas-con-pagos?empresa_id=1&fecha_inicio=2024-01-01&fecha_fin=2024-12-31
   ```

### Updated Endpoints

- **Create Sale** (`POST /purchase`) now accepts `pagos[]` array
- **Update Sale** (`PUT /purchase`) now accepts `pagos[]` array
- **Update Sale** (`PUT /purchase/sale`) now accepts `pagos[]` array

## Business Rules Implemented

1. ✅ **Payment Validation**: Sum of payments cannot exceed sale total
2. ✅ **Sold Sales Requirement**: Sales with status 'vendido' must have payments
3. ✅ **Payment Completeness**: For sold sales, sum of payments must equal sale total
4. ✅ **Payment Details**: Each payment must have `metodo_pago_id` and `moneda_id`
5. ✅ **Transaction Safety**: All payment operations use database transactions
6. ✅ **Concurrency**: Payment operations use row-level locking for consistency

## Migration Notes

### Database Triggers

- Existing triggers that validate `metodo_pago_id` and `moneda_id` in `ventas` table should be updated or removed
- New validation is handled at the application level through `ventas_pagos` table

### Backward Compatibility

- Existing API calls without `pagos[]` will still work for sales with status 'generado'
- Sales with status 'vendido' now require payments to be provided
- Payment information is no longer stored directly in `ventas` table

### Testing Recommendations

1. Test creating sales with multiple payments
2. Test payment validation (sum exceeding total)
3. Test updating payments
4. Test deleting payments
5. Test reports with payment information
6. Test concurrent payment operations

## Files Modified

- `services/common/db.js` - Added transaction support
- `services/purchase/serverless.yml` - Added payment routes
- `services/purchase/storage.js` - Added payment functions
- `services/purchase/handler.js` - Added payment handlers and updated existing ones
- `services/reportes/storage.js` - Added payment report function
- `services/reportes/handler.js` - Added payment report handler
- `services/reportes/serverless.yml` - Added payment report route

## Next Steps

1. Create/update database views as specified above
2. Create the `ventas_pagos` table
3. Update any existing database triggers
4. Deploy and test the changes
5. Update frontend applications to use new payment endpoints
