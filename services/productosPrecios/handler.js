'use strict'
const {
  getProductosPrecios,
  createProductoPrecio,
  updateProductoPrecio,
  deleteProductoPrecio,
  getPreciosByProducto,
} = require('./storage')
const {
  response,
  getBody,
} = require(`${process.env['FILE_ENVIRONMENT']}common/utils`)

module.exports.create = async event => {
  try {
    const body = getBody(event)
    const { producto_id, tipo, precio } = body

    if (!producto_id || !tipo || precio === undefined) {
      throw new Error(
        'Missing required fields: producto_id, tipo, and precio are required'
      )
    }

    const productoPrecio = await createProductoPrecio({
      producto_id,
      tipo,
      precio,
    })
    return response(
      200,
      productoPrecio,
      'Precio de producto creado correctamente'
    )
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}

module.exports.read = async event => {
  try {
    const queryStringParameters = event.queryStringParameters || {}
    const { producto_id, tipo } = queryStringParameters

    const productosPrecios = await getProductosPrecios({ producto_id, tipo })
    return response(200, productosPrecios, 'Done')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}

module.exports.readByProducto = async event => {
  try {
    const { pathParameters } = event
    const { producto_id } = pathParameters

    if (!producto_id) {
      throw new Error('Missing required fields: producto_id is required')
    }

    const precios = await getPreciosByProducto({ producto_id })
    return response(200, precios, 'Done')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}

module.exports.update = async event => {
  try {
    const body = getBody(event)
    const { id, precio } = body

    if (!id || precio === undefined) {
      throw new Error('Missing required fields: id and precio are required')
    }

    const productoPrecio = await updateProductoPrecio({
      id,
      precio,
    })

    if (productoPrecio && productoPrecio.length === 0) {
      throw new Error('Precio de producto no encontrado')
    }

    return response(
      200,
      productoPrecio,
      'Precio de producto actualizado correctamente'
    )
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

    const productoPrecio = await deleteProductoPrecio({ id })
    return response(
      200,
      productoPrecio,
      'Precio de producto eliminado correctamente'
    )
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}
