const { fetchResultPg } = require(`${process.env['FILE_ENVIRONMENT']}common/db`)

const getPurchases = fetchResultPg(
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
    request
  ) =>
    request.query(
      `
      SELECT *
      FROM vista_ventas_completas
      WHERE ($1::INT IS NULL OR empresa_id = $1)
        AND ($2::INT IS NULL OR id = $2)
        AND ($3::TEXT IS NULL OR producto_codigo ILIKE '%' || $3 || '%')
        AND ($4::TEXT IS NULL OR producto_descripcion ILIKE '%' || $4 || '%')
        AND ($5::TEXT IS NULL OR producto_serie ILIKE '%' || $5 || '%')
        AND ($6::TEXT IS NULL OR producto_categoria ILIKE '%' || $6 || '%')
        AND ($7::TEXT IS NULL OR producto_estado = $7)
        AND ($8::TEXT IS NULL OR cliente_nombre ILIKE '%' || $8 || '%')
        AND ($9::TEXT IS NULL OR cliente_nit = $9)
        AND ($10::TEXT IS NULL OR cliente_email ILIKE '%' || $10 || '%')
        AND ($11::TEXT IS NULL OR usuario_nombre ILIKE '%' || $11 || '%')
        AND ($12::TEXT IS NULL OR estado_venta = $12)
        AND (
          ($13::DATE IS NULL AND $14::DATE IS NULL) 
          OR 
          (DATE(fecha_venta) BETWEEN $13 AND $14)          
        )
      ORDER BY fecha_venta DESC
      `,
      [
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
      ]
    ),
  { singleResult: false }
)

const verificarStockDisponible = fetchResultPg(
  ({ producto_id }, request) =>
    request.query(
      `
      SELECT stock, estado,descripcion
      FROM productos
      WHERE id = $1
      `,
      [producto_id]
    ),
  { singleResult: true }
)

const createVenta = fetchResultPg(
  (
    { empresa_id, cliente_id, usuario_id, total, estado = 'generado' },
    request
  ) =>
    request.query(
      `
      INSERT INTO ventas (
        empresa_id, cliente_id, usuario_id, total, estado
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [empresa_id, cliente_id, usuario_id, total, estado]
    ),
  { singleResult: true }
)

const createDetalleVenta = fetchResultPg(
  ({ venta_id, producto_id, cantidad, precio_unitario, subtotal }, request) =>
    request.query(
      `
      INSERT INTO detalles_ventas (
        venta_id, producto_id, cantidad, precio_unitario, subtotal
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [venta_id, producto_id, cantidad, precio_unitario, subtotal]
    ),
  { singleResult: true }
)

const deleteVenta = fetchResultPg(
  ({ venta_id }, request) =>
    request.query(`DELETE FROM ventas WHERE id = $1 RETURNING *`, [venta_id]),
  { singleResult: true }
)

const updateVenta = fetchResultPg(
  ({ venta_id, estado }, request) =>
    request.query(
      `
      WITH venta_actual AS (
        SELECT * FROM ventas WHERE id = $1::INTEGER
      ),
      nueva_venta AS (
        INSERT INTO ventas (
          empresa_id, cliente_id, usuario_id, total, estado
        )
        SELECT empresa_id, cliente_id, usuario_id, total, $2
        FROM venta_actual
        RETURNING *
      )
      SELECT * FROM nueva_venta
      `,
      [venta_id, estado]
    ),
  { singleResult: true }
)

const replaceDetallesVenta = fetchResultPg(
  async ({ venta_id, detalle }, request) => {
    // Eliminar los detalles actuales
    await request.query(`DELETE FROM detalles_ventas WHERE venta_id = $1`, [
      venta_id,
    ])

    // Insertar los nuevos detalles
    for (const item of detalle) {
      await request.query(
        `
        INSERT INTO detalles_ventas (
          venta_id, producto_id, cantidad, precio_unitario, subtotal
        ) VALUES ($1, $2, $3, $4, $5)
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

const getVentaById = fetchResultPg(
  ({ venta_id }, request) =>
    request.query(`SELECT * FROM ventas WHERE id = $1`, [venta_id]),
  { singleResult: true }
)

const getDetallesVentaByVentaId = fetchResultPg(
  ({ venta_id }, request) =>
    request.query(`SELECT * FROM detalles_ventas WHERE venta_id = $1`, [
      venta_id,
    ]),
  { singleResult: false }
)

const cancelarVenta = fetchResultPg(
  ({ venta_id }, request) =>
    request.query(
      `UPDATE ventas SET estado = 'cancelado' WHERE id = $1 RETURNING *`,
      [venta_id]
    ),
  { singleResult: true }
)

const crearMovimientoDevolucion = fetchResultPg(
  (
    { empresa_id, producto_id, usuario_id, cantidad, comentario, referencia },
    request
  ) =>
    request.query(
      `
      INSERT INTO movimientos_inventario (
        empresa_id,
        producto_id,
        usuario_id,
        tipo_movimiento,
        cantidad,
        comentario,
        referencia
      ) VALUES ($1, $2, $3, 'devolucion', $4, $5, $6)
      RETURNING *
      `,
      [empresa_id, producto_id, usuario_id, cantidad, comentario, referencia]
    ),
  { singleResult: true }
)

const getPurchasesFlat = fetchResultPg(
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
    request
  ) =>
    request.query(
      `
      SELECT * FROM vista_ventas_detalle_anidado
      WHERE ($1::INT IS NULL OR empresa_id = $1)
        AND ($2::INT IS NULL OR id = $2)
        AND ($3::TEXT IS NULL OR cliente_nombre ILIKE '%' || $3 || '%')
        AND ($4::TEXT IS NULL OR cliente_nit = $4)
        AND ($5::TEXT IS NULL OR cliente_email ILIKE '%' || $5 || '%')
        AND ($6::TEXT IS NULL OR usuario_nombre ILIKE '%' || $6 || '%')
        AND ($7::TEXT IS NULL OR estado_venta = $7)
        AND ($8::DATE IS NULL OR DATE(fecha_venta) = $8)
      ORDER BY fecha_venta DESC
      `,
      [
        empresa_id,
        id,
        cliente_nombre,
        cliente_nit,
        cliente_email,
        usuario_nombre,
        estado_venta,
        fecha_venta,
      ]
    ),
  { singleResult: false }
)

const copiarDetallesVenta = fetchResultPg(
  ({ venta_id_original, venta_id_nueva }, request) =>
    request.query(
      `
      INSERT INTO detalles_ventas (
        venta_id, producto_id, cantidad, precio_unitario, subtotal
      )
      SELECT $2::INTEGER, producto_id, cantidad, precio_unitario, subtotal
      FROM detalles_ventas
      WHERE venta_id = $1::INTEGER
      RETURNING *
      `,
      [venta_id_original, venta_id_nueva]
    ),
  { singleResult: false }
)

const updateVentaStatus = fetchResultPg(
  ({ venta_id, estado }, request) =>
    request.query(
      `
        UPDATE ventas
        SET estado = $2         
        WHERE id = $1
        RETURNING *
        `,
      [venta_id, estado]
    ),
  { singleResult: true }
)

const updateSale = fetchResultPg(
  (
    { venta_id, empresa_id, cliente_id, usuario_id, total, estado, detalle },
    request
  ) =>
    request.query(
      `
      WITH updated_venta AS (
        UPDATE ventas
        SET empresa_id = $2,
            cliente_id = $3,
            usuario_id = $4,
            total = $5,
            estado = $6
        WHERE id = $1
        RETURNING *
      ),
      existing_details AS (
        SELECT id, producto_id, cantidad, precio_unitario, subtotal
        FROM detalles_ventas
        WHERE venta_id = $1
      ),
      updated_details AS (
        UPDATE detalles_ventas dv
        SET producto_id = d.producto_id,
            cantidad = d.cantidad,
            precio_unitario = d.precio_unitario,
            subtotal = d.subtotal
        FROM unnest($7::INT[], $8::INT[], $9::DECIMAL[], $10::DECIMAL[]) AS d(producto_id, cantidad, precio_unitario, subtotal)
        WHERE dv.venta_id = $1
        AND dv.id = ANY($11::INT[])
        RETURNING dv.*
      ),
      new_details AS (
        INSERT INTO detalles_ventas (
          venta_id, producto_id, cantidad, precio_unitario, subtotal
        )
        SELECT $1, d.producto_id, d.cantidad, d.precio_unitario, d.subtotal
        FROM unnest($7::INT[], $8::INT[], $9::DECIMAL[], $10::DECIMAL[]) AS d(producto_id, cantidad, precio_unitario, subtotal)
        WHERE NOT EXISTS (
          SELECT 1 FROM detalles_ventas dv 
          WHERE dv.venta_id = $1 
          AND dv.id = ANY($11::INT[])
        )
        RETURNING *
      ),
      deleted_details AS (
        DELETE FROM detalles_ventas
        WHERE venta_id = $1
        AND id NOT IN (
          SELECT unnest($11::INT[])
        )
        RETURNING *
      )
      SELECT * FROM updated_venta
      `,
      [
        venta_id,
        empresa_id,
        cliente_id,
        usuario_id,
        total,
        estado,
        detalle.map(item => item.producto_id),
        detalle.map(item => item.cantidad),
        detalle.map(item => item.precio_unitario),
        detalle.map(item => item.subtotal),
        detalle.map(item => item.id || null), // IDs de los detalles existentes
      ]
    ),
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
