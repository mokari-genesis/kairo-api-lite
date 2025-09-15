'use strict'
const {
  getReporteInventarioConMetodo,
  getReporteMovimientosInventario,
  getReporteStockActual,
} = require('./storage')
const {
  response,
  getBody,
} = require(`${process.env['FILE_ENVIRONMENT']}common/utils`)

module.exports.reporteInventarioConMetodo = async event => {
  try {
    const queryStringParameters = event.queryStringParameters || {}
    const {
      empresa_id,
      producto_id,
      tipo_movimiento,
      fecha_inicio,
      fecha_fin,
    } = queryStringParameters

    const reporte = await getReporteInventarioConMetodo({
      empresa_id,
      producto_id,
      tipo_movimiento,
      fecha_inicio,
      fecha_fin,
    })
    return response(200, reporte, 'Done')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}

module.exports.reporteMovimientosInventario = async event => {
  try {
    const queryStringParameters = event.queryStringParameters || {}
    const {
      empresa_id,
      producto_id,
      tipo_movimiento,
      fecha_inicio,
      fecha_fin,
    } = queryStringParameters

    const reporte = await getReporteMovimientosInventario({
      empresa_id,
      producto_id,
      tipo_movimiento,
      fecha_inicio,
      fecha_fin,
    })
    return response(200, reporte, 'Done')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}

module.exports.reporteStockActual = async event => {
  try {
    const queryStringParameters = event.queryStringParameters || {}
    const { empresa_id } = queryStringParameters

    const reporte = await getReporteStockActual({ empresa_id })
    return response(200, reporte, 'Done')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}
