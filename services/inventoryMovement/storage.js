const { fetchResultPg } = require(`${process.env['FILE_ENVIRONMENT']}common/db`)

const getInventoryMovements = fetchResultPg(
  (
    {
      codigo_producto,
      usuario,
      tipo_movimiento,
      cantidad,
      comentario,
      producto,
      fecha_inicio,
      fecha_fin,
    },
    request
  ) =>
    request.query(
      `
      SELECT * FROM reporte_movimientos_inventario
      WHERE ($1::TEXT IS NULL OR codigo_producto ILIKE '%' || $1 || '%')
        AND ($2::TEXT IS NULL OR usuario ILIKE '%' || $2 || '%')
        AND ($3::TEXT IS NULL OR tipo_movimiento = $3)        
        AND ($4::INT IS NULL OR cantidad = $4)
        AND ($5::TEXT IS NULL OR comentario ILIKE '%' || $5 || '%')                
        AND ($6::TEXT IS NULL OR producto ILIKE '%' || $6 || '%')
        AND (
          ($7::DATE IS NULL AND $8::DATE IS NULL) 
          OR 
          (DATE(fecha) BETWEEN $7 AND $8)
        )
      ORDER BY fecha DESC
      `,
      [
        codigo_producto,
        usuario,
        tipo_movimiento,
        cantidad,
        comentario,
        producto,
        fecha_inicio,
        fecha_fin,
      ]
    ),
  { singleResult: false }
)

const deleteInventoryMovement = fetchResultPg(
  ({ id }, request) =>
    request.query(
      `
      DELETE FROM movimientos_inventario
      WHERE id = $1
      RETURNING *
      `,
      [id]
    ),
  { singleResult: true }
)

const updateInventoryMovement = fetchResultPg(
  ({ id, product_id, movement_type, quantity, comment }, request) =>
    request.query(
      `
      UPDATE movimientos_inventario
      SET producto_id = $2,
          tipo_movimiento = $3,
          cantidad = $4,
          comentario = $5,
          fecha = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id, product_id, movement_type, quantity, comment]
    ),
  { singleResult: true }
)

const createInventoryMovement = fetchResultPg(
  (
    { empresa_id, product_id, user_id, movement_type, quantity, comment },
    request
  ) =>
    request.query(
      `
      INSERT INTO movimientos_inventario (
        empresa_id, producto_id, usuario_id, tipo_movimiento, cantidad, comentario
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [empresa_id, product_id, user_id, movement_type, quantity, comment]
    ),
  { singleResult: true }
)

module.exports = {
  getInventoryMovements,
  deleteInventoryMovement,
  updateInventoryMovement,
  createInventoryMovement,
}
