const {
  fetchResultMysql,
} = require(`${process.env['FILE_ENVIRONMENT']}common/db`)

const getPurchases = fetchResultMysql(
  (
    {
      empresa_id,
      id,
      producto_codigo,
      producto_descripcion,
      producto_serie,
      producto_categoria,
      producto_estado,
      cliente_nombre,
      cliente_nit,
      cliente_email,
      usuario_nombre,
      estado_venta,
      fecha_inicio,
      fecha_fin,
    },
    connection
  ) =>
    connection.execute(
      `
      SELECT *
      FROM vista_ventas_completas
      WHERE (? IS NULL OR empresa_id = ?)
        AND (? IS NULL OR id = ?)
        AND (? IS NULL OR producto_codigo LIKE CONCAT('%', ?, '%'))
        AND (? IS NULL OR producto_descripcion LIKE CONCAT('%', ?, '%'))
        AND (? IS NULL OR producto_serie LIKE CONCAT('%', ?, '%'))
        AND (? IS NULL OR producto_categoria LIKE CONCAT('%', ?, '%'))
        AND (? IS NULL OR producto_estado = ?)
        AND (? IS NULL OR cliente_nombre LIKE CONCAT('%', ?, '%'))
        AND (? IS NULL OR cliente_nit = ?)
        AND (? IS NULL OR cliente_email LIKE CONCAT('%', ?, '%'))
        AND (? IS NULL OR usuario_nombre LIKE CONCAT('%', ?, '%'))
        AND (? IS NULL OR estado_venta = ?)
        AND (
          (? IS NULL AND ? IS NULL) 
          OR 
          (DATE(fecha_venta) BETWEEN ? AND ?)          
        )
      ORDER BY fecha_venta DESC
      `,
      [
        empresa_id || null,
        empresa_id || null,
        id || null,
        id || null,
        producto_codigo || null,
        producto_codigo || null,
        producto_descripcion || null,
        producto_descripcion || null,
        producto_serie || null,
        producto_serie || null,
        producto_categoria || null,
        producto_categoria || null,
        producto_estado || null,
        producto_estado || null,
        cliente_nombre || null,
        cliente_nombre || null,
        cliente_nit || null,
        cliente_nit || null,
        cliente_email || null,
        cliente_email || null,
        usuario_nombre || null,
        usuario_nombre || null,
        estado_venta || null,
        estado_venta || null,
        fecha_inicio || null,
        fecha_fin || null,
        fecha_inicio || null,
        fecha_fin || null,
      ]
    ),
  { singleResult: false }
)

const verificarStockDisponible = fetchResultMysql(
  ({ producto_id }, connection) =>
    connection.execute(
      `
      SELECT stock, estado, descripcion
      FROM productos
      WHERE id = ?
      `,
      [producto_id]
    ),
  { singleResult: true }
)

const createVenta = fetchResultMysql(
  async (
    { empresa_id, cliente_id, usuario_id, total, estado = 'generado' },
    connection
  ) => {
    await connection.execute(
      `
      INSERT INTO ventas (
        empresa_id, cliente_id, usuario_id, total, estado
      ) VALUES (?, ?, ?, ?, ?)
      `,
      [empresa_id, cliente_id, usuario_id, total, estado]
    )
    const [result] = await connection.execute(
      'SELECT * FROM ventas WHERE id = LAST_INSERT_ID()'
    )
    return result
  },
  { singleResult: true }
)

const createDetalleVenta = fetchResultMysql(
  async (
    { venta_id, producto_id, cantidad, precio_unitario, subtotal },
    connection
  ) => {
    await connection.execute(
      `
      INSERT INTO detalles_ventas (
        venta_id, producto_id, cantidad, precio_unitario, subtotal
      ) VALUES (?, ?, ?, ?, ?)
      `,
      [venta_id, producto_id, cantidad, precio_unitario, subtotal]
    )
    const [result] = await connection.execute(
      'SELECT * FROM detalles_ventas WHERE id = LAST_INSERT_ID()'
    )
    return result
  },
  { singleResult: true }
)

const deleteVenta = fetchResultMysql(
  async ({ venta_id }, connection) => {
    // First, get the record before deleting it
    const [existingRecord] = await connection.execute(
      'SELECT * FROM ventas WHERE id = ?',
      [venta_id]
    )

    if (existingRecord.length === 0) {
      throw new Error('Venta not found')
    }

    // Delete the record
    await connection.execute(`DELETE FROM ventas WHERE id = ?`, [venta_id])

    // Return the deleted record
    return existingRecord
  },
  { singleResult: true }
)

const updateVenta = fetchResultMysql(
  async ({ venta_id, estado }, connection) => {
    await connection.execute(
      `
      INSERT INTO ventas (
        empresa_id, cliente_id, usuario_id, total, estado
      )
      SELECT empresa_id, cliente_id, usuario_id, total, ?
      FROM ventas
      WHERE id = ?
      `,
      [estado, venta_id]
    )
    const [result] = await connection.execute(
      'SELECT * FROM ventas WHERE id = LAST_INSERT_ID()'
    )
    return result
  },
  { singleResult: true }
)

const replaceDetallesVenta = fetchResultMysql(
  async ({ venta_id, detalle }, connection) => {
    // Eliminar los detalles actuales
    await connection.execute(`DELETE FROM detalles_ventas WHERE venta_id = ?`, [
      venta_id,
    ])

    // Insertar los nuevos detalles
    for (const item of detalle) {
      await connection.execute(
        `
        INSERT INTO detalles_ventas (
          venta_id, producto_id, cantidad, precio_unitario, subtotal
        ) VALUES (?, ?, ?, ?, ?)
        `,
        [
          venta_id,
          item.producto_id,
          item.cantidad,
          item.precio_unitario,
          item.subtotal,
        ]
      )
    }

    return { success: true }
  },
  { singleResult: true }
)

const getVentaById = fetchResultMysql(
  ({ venta_id }, connection) =>
    connection.execute(`SELECT * FROM ventas WHERE id = ?`, [venta_id]),
  { singleResult: true }
)

const getDetallesVentaByVentaId = fetchResultMysql(
  ({ venta_id }, connection) =>
    connection.execute(`SELECT * FROM detalles_ventas WHERE venta_id = ?`, [
      venta_id,
    ]),
  { singleResult: false }
)

const cancelarVenta = fetchResultMysql(
  async ({ venta_id }, connection) => {
    await connection.execute(
      `UPDATE ventas SET estado = 'cancelado' WHERE id = ?`,
      [venta_id]
    )
    const [result] = await connection.execute(
      'SELECT * FROM ventas WHERE id = ?',
      [venta_id]
    )
    return result
  },
  { singleResult: true }
)

const crearMovimientoDevolucion = fetchResultMysql(
  async (
    { empresa_id, producto_id, usuario_id, cantidad, comentario, referencia },
    connection
  ) => {
    await connection.execute(
      `
      INSERT INTO movimientos_inventario (
        empresa_id,
        producto_id,
        usuario_id,
        tipo_movimiento,
        cantidad,
        comentario,
        referencia
      ) VALUES (?, ?, ?, 'devolucion', ?, ?, ?)
      `,
      [empresa_id, producto_id, usuario_id, cantidad, comentario, referencia]
    )
    const [result] = await connection.execute(
      'SELECT * FROM movimientos_inventario WHERE id = LAST_INSERT_ID()'
    )
    return result
  },
  { singleResult: true }
)

const getPurchasesFlat = fetchResultMysql(
  (
    {
      empresa_id,
      id,
      cliente_nombre,
      cliente_nit,
      cliente_email,
      usuario_nombre,
      estado_venta,
      fecha_venta,
    },
    connection
  ) =>
    connection.execute(
      `
      SELECT * FROM vista_ventas_detalle_anidado
      WHERE (? IS NULL OR empresa_id = ?)
        AND (? IS NULL OR id = ?)
        AND (? IS NULL OR cliente_nombre LIKE CONCAT('%', ?, '%'))
        AND (? IS NULL OR cliente_nit = ?)
        AND (? IS NULL OR cliente_email LIKE CONCAT('%', ?, '%'))
        AND (? IS NULL OR usuario_nombre LIKE CONCAT('%', ?, '%'))
        AND (? IS NULL OR estado_venta = ?)
        AND (? IS NULL OR DATE(fecha_venta) = ?)
      ORDER BY fecha_venta DESC
      `,
      [
        empresa_id || null,
        empresa_id || null,
        id || null,
        id || null,
        cliente_nombre || null,
        cliente_nombre || null,
        cliente_nit || null,
        cliente_nit || null,
        cliente_email || null,
        cliente_email || null,
        usuario_nombre || null,
        usuario_nombre || null,
        estado_venta || null,
        estado_venta || null,
        fecha_venta || null,
        fecha_venta || null,
      ]
    ),
  { singleResult: false }
)

const copiarDetallesVenta = fetchResultMysql(
  ({ venta_id_original, venta_id_nueva }, connection) =>
    connection.execute(
      `
      INSERT INTO detalles_ventas (
        venta_id, producto_id, cantidad, precio_unitario, subtotal
      )
      SELECT ?, producto_id, cantidad, precio_unitario, subtotal
      FROM detalles_ventas
      WHERE venta_id = ?
      `,
      [venta_id_nueva, venta_id_original]
    ),
  { singleResult: false }
)

const updateVentaStatus = fetchResultMysql(
  async ({ venta_id, estado }, connection) => {
    await connection.execute(
      `
        UPDATE ventas
        SET estado = ?         
        WHERE id = ?
        `,
      [estado, venta_id]
    )
    const [result] = await connection.execute(
      'SELECT * FROM ventas WHERE id = ?',
      [venta_id]
    )
    return result
  },
  { singleResult: true }
)

const updateSale = fetchResultMysql(
  async (
    { venta_id, empresa_id, cliente_id, usuario_id, total, estado, detalle },
    connection
  ) => {
    await connection.execute(
      `
      UPDATE ventas
      SET empresa_id = ?,
          cliente_id = ?,
          usuario_id = ?,
          total = ?,
          estado = ?
      WHERE id = ?
      `,
      [empresa_id, cliente_id, usuario_id, total, estado, venta_id]
    )

    // Delete existing details
    await connection.execute(`DELETE FROM detalles_ventas WHERE venta_id = ?`, [
      venta_id,
    ])

    // Insert new details
    for (const item of detalle) {
      await connection.execute(
        `
        INSERT INTO detalles_ventas (
          venta_id, producto_id, cantidad, precio_unitario, subtotal
        ) VALUES (?, ?, ?, ?, ?)
        `,
        [
          venta_id,
          item.producto_id,
          item.cantidad,
          item.precio_unitario,
          item.subtotal,
        ]
      )
    }

    const [result] = await connection.execute(
      'SELECT * FROM ventas WHERE id = ?',
      [venta_id]
    )
    return result
  },
  { singleResult: true }
)

module.exports = {
  getPurchases,
  createVenta,
  verificarStockDisponible,
  createDetalleVenta,
  updateVenta,
  replaceDetallesVenta,
  cancelarVenta,
  crearMovimientoDevolucion,
  getVentaById,
  getDetallesVentaByVentaId,
  getPurchasesFlat,
  deleteVenta,
  copiarDetallesVenta,
  updateVentaStatus,
  updateSale,
}
