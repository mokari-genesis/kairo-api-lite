const {
  fetchResultMysql,
} = require(`${process.env['FILE_ENVIRONMENT']}common/db`)

const getReporteInventarioConMetodo = fetchResultMysql(
  (
    { empresa_id, producto_id, tipo_movimiento, fecha_inicio, fecha_fin },
    connection
  ) =>
    connection.execute(
      `
      SELECT * FROM reporte_inventario_con_metodo
      WHERE (? IS NULL OR empresa_id = ?)
        AND (? IS NULL OR producto_id = ?)
        AND (? IS NULL OR tipo_movimiento = ?)
        AND (
          (? IS NULL AND ? IS NULL) 
          OR 
          (DATE(fecha_movimiento) BETWEEN ? AND ?)          
        )
      AND estado_venta is not null
      ORDER BY fecha_movimiento DESC
      `,
      [
        empresa_id || null,
        empresa_id || null,
        producto_id || null,
        producto_id || null,
        tipo_movimiento || null,
        tipo_movimiento || null,
        fecha_inicio || null,
        fecha_fin || null,
        fecha_inicio || null,
        fecha_fin || null,
      ]
    ),
  { singleResult: false }
)

const getReporteMovimientosInventario = fetchResultMysql(
  (
    { empresa_id, producto_id, tipo_movimiento, fecha_inicio, fecha_fin },
    connection
  ) =>
    connection.execute(
      `
      SELECT * FROM reporte_movimientos_inventario
      WHERE (? IS NULL OR empresa_id = ?)
        AND (? IS NULL OR producto_id = ?)
        AND (? IS NULL OR tipo_movimiento = ?)
        AND (
          (? IS NULL AND ? IS NULL) 
          OR 
          (DATE(fecha) BETWEEN ? AND ?)          
        )
      ORDER BY fecha DESC
      `,
      [
        empresa_id || null,
        empresa_id || null,
        producto_id || null,
        producto_id || null,
        tipo_movimiento || null,
        tipo_movimiento || null,
        fecha_inicio || null,
        fecha_fin || null,
        fecha_inicio || null,
        fecha_fin || null,
      ]
    ),
  { singleResult: false }
)

const getReporteStockActual = fetchResultMysql(
  ({ empresa_id }, connection) =>
    connection.execute(
      `
      SELECT * FROM reporte_stock_actual
      WHERE (? IS NULL OR empresa_id = ?)
      ORDER BY empresa, descripcion
      `,
      [empresa_id || null, empresa_id || null]
    ),
  { singleResult: false }
)

module.exports = {
  getReporteInventarioConMetodo,
  getReporteMovimientosInventario,
  getReporteStockActual,
}
