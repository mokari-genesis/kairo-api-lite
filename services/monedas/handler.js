'use strict'
const {
  getMonedas,
  createMoneda,
  updateMoneda,
  deleteMoneda,
} = require('./storage')
const {
  response,
  getBody,
} = require(`${process.env['FILE_ENVIRONMENT']}common/utils`)

module.exports.create = async event => {
  try {
    const body = getBody(event)
    const { codigo, nombre, simbolo, decimales = 2, activo = true } = body

    if (!codigo || !nombre) {
      throw new Error('Missing required fields: codigo and nombre are required')
    }

    const moneda = await createMoneda({
      codigo,
      nombre,
      simbolo,
      decimales,
      activo,
    })
    return response(200, moneda, 'Moneda creada correctamente')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}

module.exports.read = async event => {
  try {
    const queryStringParameters = event.queryStringParameters || {}
    const { activo } = queryStringParameters

    const monedas = await getMonedas({ activo })
    return response(200, monedas, 'Done')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}

module.exports.update = async event => {
  try {
    const body = getBody(event)
    const { id, codigo, nombre, simbolo, decimales, activo } = body

    if (!id) {
      throw new Error('Missing required fields: id is required')
    }

    const moneda = await updateMoneda({
      id,
      codigo,
      nombre,
      simbolo,
      decimales,
      activo,
    })

    if (moneda && moneda.length === 0) {
      throw new Error('Moneda no encontrada')
    }

    return response(200, moneda, 'Moneda actualizada correctamente')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}

module.exports.delete = async event => {
  try {
    const body = getBody(event)
    const { id } = body

    if (!id) {
      throw new Error('Missing required fields: id is required')
    }

    const moneda = await deleteMoneda({ id })
    return response(200, moneda, 'Moneda eliminada correctamente')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}
