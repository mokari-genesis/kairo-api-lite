const {
  fetchResultMysql,
} = require(`${process.env['FILE_ENVIRONMENT']}common/db`)

const getInventoryMovements = fetchResultMysql(
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
    connection
  ) =>
    connection.execute(
      `
      SELECT * FROM reporte_movimientos_inventario
      WHERE (? IS NULL OR codigo_producto LIKE CONCAT('%', ?, '%'))
        AND (? IS NULL OR usuario LIKE CONCAT('%', ?, '%'))
        AND (? IS NULL OR tipo_movimiento = ?)        
        AND (? IS NULL OR cantidad = ?)
        AND (? IS NULL OR comentario LIKE CONCAT('%', ?, '%'))                
        AND (? IS NULL OR producto LIKE CONCAT('%', ?, '%'))
        AND (
          (? IS NULL AND ? IS NULL) 
          OR 
          (DATE(fecha) BETWEEN ? AND ?)
        )
      ORDER BY id DESC
      `,
      [
        codigo_producto || null,
        codigo_producto || null,
        usuario || null,
        usuario || null,
        tipo_movimiento || null,
        tipo_movimiento || null,
        cantidad || null,
        cantidad || null,
        comentario || null,
        comentario || null,
        producto || null,
        producto || null,
        fecha_inicio || null,
        fecha_fin || null,
        fecha_inicio || null,
        fecha_fin || null,
      ]
    ),
  { singleResult: false }
)

const deleteInventoryMovement = fetchResultMysql(
  async ({ id }, connection) => {
    // First, get the record before deleting it
    const [existingRecord] = await connection.execute(
      'SELECT * FROM movimientos_inventario WHERE id = ?',
      [id]
    )

    if (existingRecord.length === 0) {
      throw new Error('Inventory movement not found')
    }

    // Delete the record
    await connection.execute(
      `
      DELETE FROM movimientos_inventario
      WHERE id = ?
      `,
      [id]
    )

    // Return the deleted record
    return existingRecord
  },
  { singleResult: true }
)

const updateInventoryMovement = fetchResultMysql(
  async ({ id, product_id, movement_type, quantity, comment }, connection) => {
    await connection.execute(
      `
      UPDATE movimientos_inventario
      SET producto_id = ?,
          tipo_movimiento = ?,
          cantidad = ?,
          comentario = ?,
          fecha = NOW()
      WHERE id = ?
      `,
      [product_id, movement_type, quantity, comment, id]
    )
    const [result] = await connection.execute(
      'SELECT * FROM movimientos_inventario WHERE id = ?',
      [id]
    )
    return result
  },
  { singleResult: true }
)

const createInventoryMovement = fetchResultMysql(
  async (
    { empresa_id, product_id, user_id, movement_type, quantity, comment },
    connection
  ) => {
    await connection.execute(
      `
      INSERT INTO movimientos_inventario (
        empresa_id, producto_id, usuario_id, tipo_movimiento, cantidad, comentario
      ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      [empresa_id, product_id, user_id, movement_type, quantity, comment]
    )
    const [result] = await connection.execute(
      'SELECT * FROM movimientos_inventario WHERE id = LAST_INSERT_ID()'
    )
    return result
  },
  { singleResult: true }
)

module.exports = {
  getInventoryMovements,
  deleteInventoryMovement,
  updateInventoryMovement,
  createInventoryMovement,
}
