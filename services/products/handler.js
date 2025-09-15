'use strict'
const {
  getProducts,
  createProduct,
  deleteProducts,
  updateProduct,
  getProductosPrecios,
  createProductoPrecio,
  updateProductoPrecio,
  deleteProductoPrecio,
} = require('./storage')
const {
  response,
  getBody,
} = require(`${process.env['FILE_ENVIRONMENT']}common/utils`)

module.exports.create = async event => {
  try {
    const body = getBody(event)
    const {
      empresa_id,
      codigo,
      serie,
      descripcion,
      categoria,
      estado,
      stock,
      precio,
      proveedor_id,
    } = body

    if (
      !empresa_id ||
      !codigo ||
      !serie ||
      !descripcion ||
      !categoria ||
      !estado ||
      !stock
    ) {
      throw new Error('Missing required fields')
    }

    const product = await createProduct({
      empresa_id,
      codigo,
      serie,
      descripcion,
      categoria,
      estado,
      stock,
      precio,
      proveedor_id,
    })
    return response(200, product, 'Done')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}

module.exports.read = async event => {
  try {
    const queryStringParameters = event.queryStringParameters || {}
    const {
      product_id,
      empresa_id,
      codigo,
      serie,
      descripcion,
      categoria,
      estado,
      stock,
      nombre_proveedor,
    } = queryStringParameters

    const products = await getProducts({
      empresa_id,
      product_id,
      codigo,
      serie,
      descripcion,
      categoria,
      estado,
      stock,
      nombre_proveedor,
    })
    return response(200, products, 'Done')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}

module.exports.update = async event => {
  try {
    const body = getBody(event)
    const {
      product_id,
      empresa_id,
      codigo,
      serie,
      descripcion,
      categoria,
      estado,
      stock,
      proveedor_id,
    } = body

    if (
      !product_id ||
      !empresa_id //||
      // !codigo ||
      // !serie ||
      // !descripcion ||
      // !categoria ||
      // !estado ||
      // !stock
    ) {
      throw new Error('Missing required fields')
    }

    const product = await updateProduct({
      product_id,
      empresa_id,
      codigo,
      serie,
      descripcion,
      categoria,
      estado,
      stock,
      proveedor_id,
    })

    if (product && product.length === 0) {
      throw new Error('Product not found')
    }

    return response(200, product, 'Done')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}

module.exports.delete = async event => {
  try {
    const body = getBody(event)
    const { product_ids } = body

    if (!product_ids) {
      throw new Error('Missing required fields')
    }

    const products = await deleteProducts({ product_ids })
    return response(200, products, 'Done')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}

module.exports.createPrecio = async event => {
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

module.exports.readPrecios = async event => {
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

module.exports.updatePrecio = async event => {
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

module.exports.deletePrecio = async event => {
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
