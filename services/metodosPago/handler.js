'use strict'
const {
  getMetodosPago,
  createMetodoPago,
  updateMetodoPago,
  deleteMetodoPago,
} = require('./storage')
const {
  response,
  getBody,
} = require(`${process.env['FILE_ENVIRONMENT']}common/utils`)

module.exports.create = async event => {
  try {
    const body = getBody(event)
    const { nombre, activo = true } = body

    if (!nombre) {
      throw new Error('Missing required fields')
    }

    const metodoPago = await createMetodoPago({
      nombre,
      activo,
    })
    return response(200, metodoPago, 'Método de pago creado correctamente')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}

module.exports.read = async event => {
  try {
    const queryStringParameters = event.queryStringParameters || {}
    const { activo, nombre } = queryStringParameters

    const metodosPago = await getMetodosPago({ activo, nombre })
    return response(200, metodosPago, 'Done')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}

module.exports.update = async event => {
  try {
    const body = getBody(event)
    const { id, nombre, activo } = body

    if (!id) {
      throw new Error('Missing required fields')
    }

    const metodoPago = await updateMetodoPago({
      id,
      nombre,
      activo,
    })

    if (metodoPago && metodoPago.length === 0) {
      throw new Error('Método de pago no encontrado')
    }

    return response(200, metodoPago, 'Método de pago actualizado correctamente')
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
      throw new Error('Missing required fields')
    }

    const metodoPago = await deleteMetodoPago({ id })
    return response(200, metodoPago, 'Método de pago eliminado correctamente')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}
