const {
  fetchResultMysql,
} = require(`${process.env['FILE_ENVIRONMENT']}common/db`)

const getMetodosPagoUnificado = fetchResultMysql(
  async (
    {
      empresa_id,
      venta_id,
      cliente_id,
      usuario_id,
      metodo_pago_id,
      moneda_id,
      estado_venta,
      estado_pago,
      fecha_venta_inicio,
      fecha_venta_fin,
      fecha_pago_inicio,
      fecha_pago_fin,
      venta_es_vendida,
      limit,
      offset,
    },
    connection
  ) => {
    return connection.execute(
      `
      SELECT 
        empresa_id,
        empresa_nombre,
        venta_id,
        fecha_venta,
        fecha_venta_dia,
        estado_venta,
        estado_pago,
        total_venta,
        moneda_id,
        moneda_codigo,
        moneda_nombre,
        moneda_simbolo,
        comentario_venta,
        cliente_id,
        cliente_nombre,
        cliente_telefono,
        cliente_email,
        usuario_id,
        usuario_nombre,
        pago_id,
        metodo_pago_id,
        metodo_pago,
        monto_pago,
        referencia_pago,
        fecha_pago,
        fecha_pago_dia,
        total_pagado_venta,
        cantidad_pagos_venta,
        total_por_metodo_en_venta,
        saldo_pendiente_venta,
        venta_es_vendida_bool
      FROM vista_metodos_pago_unificado
      WHERE (? IS NULL OR empresa_id = ?)
        AND (? IS NULL OR venta_id = ?)
        AND (? IS NULL OR cliente_id = ?)
        AND (? IS NULL OR usuario_id = ?)
        AND (? IS NULL OR metodo_pago_id = ?)
        AND (? IS NULL OR moneda_id = ?)
        AND (? IS NULL OR estado_venta = ?)
        AND (? IS NULL OR estado_pago = ?)
        AND (? IS NULL OR venta_es_vendida_bool = ?)
        AND (? IS NULL OR fecha_venta_dia >= ?)
        AND (? IS NULL OR fecha_venta_dia <= ?)
        AND (? IS NULL OR fecha_pago_dia >= ?)
        AND (? IS NULL OR fecha_pago_dia <= ?)
      ORDER BY fecha_venta DESC, venta_id DESC, fecha_pago DESC
      LIMIT 100 OFFSET 0
      
      `,
      [
        empresa_id || null,
        empresa_id || null,
        venta_id || null,
        venta_id || null,
        cliente_id || null,
        cliente_id || null,
        usuario_id || null,
        usuario_id || null,
        metodo_pago_id || null,
        metodo_pago_id || null,
        moneda_id || null,
        moneda_id || null,
        estado_venta || null,
        estado_venta || null,
        estado_pago || null,
        estado_pago || null,
        venta_es_vendida || null,
        venta_es_vendida || null,
        fecha_venta_inicio || null,
        fecha_venta_inicio || null,
        fecha_venta_fin || null,
        fecha_venta_fin || null,
        fecha_pago_inicio || null,
        fecha_pago_inicio || null,
        fecha_pago_fin || null,
        fecha_pago_fin || null,
      ]
    )
  },
  { singleResult: false }
)

const getMetodosPagoUnificadoResumen = fetchResultMysql(
  async (
    {
      empresa_id,
      cliente_id,
      usuario_id,
      metodo_pago_id,
      moneda_id,
      estado_venta,
      estado_pago,
      fecha_venta_inicio,
      fecha_venta_fin,
      fecha_pago_inicio,
      fecha_pago_fin,
      venta_es_vendida,
      agrupar_por,
    },
    connection
  ) => {
    // Build dynamic GROUP BY clause based on agrupar_por parameter
    let groupByClause = ''
    let selectFields = ''

    switch (agrupar_por) {
      case 'metodo_pago':
        groupByClause = 'metodo_pago_id, metodo_pago'
        selectFields = 'metodo_pago_id, metodo_pago, NULL as grupo_nombre'
        break
      case 'cliente':
        groupByClause = 'cliente_id, cliente_nombre'
        selectFields =
          'cliente_id, cliente_nombre as grupo_nombre, NULL as metodo_pago'
        break
      case 'usuario':
        groupByClause = 'usuario_id, usuario_nombre'
        selectFields =
          'usuario_id, usuario_nombre as grupo_nombre, NULL as metodo_pago'
        break
      case 'moneda':
        groupByClause = 'moneda_id, moneda_codigo'
        selectFields =
          'moneda_id, moneda_codigo as grupo_nombre, NULL as metodo_pago'
        break
      case 'fecha_venta_dia':
        groupByClause = 'fecha_venta_dia'
        selectFields =
          'fecha_venta_dia as grupo_nombre, NULL as metodo_pago, NULL as cliente_id'
        break
      case 'fecha_pago_dia':
        groupByClause = 'fecha_pago_dia'
        selectFields =
          'fecha_pago_dia as grupo_nombre, NULL as metodo_pago, NULL as cliente_id'
        break
      default:
        groupByClause = 'metodo_pago_id, metodo_pago'
        selectFields = 'metodo_pago_id, metodo_pago, NULL as grupo_nombre'
    }

    return connection.execute(
      `
      SELECT 
        ${selectFields},
        COUNT(DISTINCT venta_id) as total_ventas,
        COUNT(pago_id) as total_pagos,
        SUM(monto_pago) as total_monto_pagado,
        AVG(monto_pago) as promedio_monto_pago,
        MIN(monto_pago) as monto_minimo,
        MAX(monto_pago) as monto_maximo,
        SUM(total_por_metodo_en_venta) as total_ventas_monto,
        AVG(total_venta) as promedio_venta,
        SUM(saldo_pendiente_venta) as total_saldo_pendiente,
        COUNT(DISTINCT CASE WHEN venta_es_vendida_bool = 1 THEN venta_id END) as ventas_completadas,
        COUNT(DISTINCT CASE WHEN venta_es_vendida_bool = 0 THEN venta_id END) as ventas_pendientes,
        moneda_codigo,
        moneda_nombre,
        moneda_simbolo,
        estado_venta
      FROM vista_metodos_pago_unificado
      WHERE (? IS NULL OR empresa_id = ?)
        AND (? IS NULL OR cliente_id = ?)
        AND (? IS NULL OR usuario_id = ?)
        AND (? IS NULL OR metodo_pago_id = ?)
        AND (? IS NULL OR moneda_id = ?)
        AND (? IS NULL OR estado_venta = ?)
        AND (? IS NULL OR estado_pago = ?)
        AND (? IS NULL OR venta_es_vendida_bool = ?)
        AND (? IS NULL OR fecha_venta_dia >= ?)
        AND (? IS NULL OR fecha_venta_dia <= ?)
        AND (? IS NULL OR fecha_pago_dia >= ?)
        AND (? IS NULL OR fecha_pago_dia <= ?)
      GROUP BY ${groupByClause}
      ORDER BY total_monto_pagado DESC
      `,
      [
        empresa_id || null,
        empresa_id || null,
        cliente_id || null,
        cliente_id || null,
        usuario_id || null,
        usuario_id || null,
        metodo_pago_id || null,
        metodo_pago_id || null,
        moneda_id || null,
        moneda_id || null,
        estado_venta || null,
        estado_venta || null,
        estado_pago || null,
        estado_pago || null,
        venta_es_vendida || null,
        venta_es_vendida || null,
        fecha_venta_inicio || null,
        fecha_venta_inicio || null,
        fecha_venta_fin || null,
        fecha_venta_fin || null,
        fecha_pago_inicio || null,
        fecha_pago_inicio || null,
        fecha_pago_fin || null,
        fecha_pago_fin || null,
      ]
    )
  },
  { singleResult: false }
)

module.exports = {
  getMetodosPagoUnificado,
  getMetodosPagoUnificadoResumen,
}
