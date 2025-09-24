'use strict'
const {
  getMetodosPagoUnificado,
  getMetodosPagoUnificadoResumen,
} = require('./storage')
const {
  response,
  getBody,
} = require(`${process.env['FILE_ENVIRONMENT']}common/utils`)

module.exports.getMetodosPagoUnificado = async event => {
  try {
    const queryStringParameters = event.queryStringParameters || {}
    const {
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
    } = queryStringParameters

    const reporte = await getMetodosPagoUnificado({
      empresa_id: empresa_id ? parseInt(empresa_id) : null,
      venta_id: venta_id ? parseInt(venta_id) : null,
      cliente_id: cliente_id ? parseInt(cliente_id) : null,
      usuario_id: usuario_id ? parseInt(usuario_id) : null,
      metodo_pago_id: metodo_pago_id ? parseInt(metodo_pago_id) : null,
      moneda_id: moneda_id ? parseInt(moneda_id) : null,
      estado_venta,
      estado_pago,
      fecha_venta_inicio,
      fecha_venta_fin,
      fecha_pago_inicio,
      fecha_pago_fin,
      venta_es_vendida: venta_es_vendida
        ? venta_es_vendida === 'true' || venta_es_vendida === '1'
        : null,
      limit: !isNaN(parseInt(limit)) ? parseInt(limit) : 100,
      offset: !isNaN(parseInt(offset)) ? parseInt(offset) : 0,
    })
    return response(200, reporte, 'Done')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}

module.exports.getMetodosPagoUnificadoResumen = async event => {
  try {
    const queryStringParameters = event.queryStringParameters || {}
    const {
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
      agrupar_por = 'metodo_pago', // metodo_pago, cliente, usuario, moneda, fecha_venta_dia, fecha_pago_dia
    } = queryStringParameters

    const resumen = await getMetodosPagoUnificadoResumen({
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
    })
    return response(200, resumen, 'Done')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}
