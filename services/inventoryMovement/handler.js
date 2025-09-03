'use strict'
const {
  createInventoryMovement,
  deleteInventoryMovement,
  updateInventoryMovement,
  getInventoryMovements,
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
      product_id,
      user_id,
      movement_type,
      quantity,
      comment,
    } = body

    if (
      !empresa_id ||
      !product_id ||
      !user_id ||
      !movement_type ||
      !quantity ||
      !comment
    ) {
      throw new Error('Missing required fields')
    }

    const inventoryMovement = await createInventoryMovement({
      empresa_id,
      product_id,
      user_id,
      movement_type,
      quantity,
      comment,
    })
    return response(200, inventoryMovement, 'Done')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}

module.exports.read = async event => {
  try {
    const {
      queryStringParameters: {
        codigo_producto,
        usuario,
        tipo_movimiento,
        cantidad,
        comentario,
        producto,
        fecha_inicio,
        fecha_fin,
      },
    } = event

    const inventoryMovements = await getInventoryMovements({
      codigo_producto,
      usuario,
      tipo_movimiento,
      cantidad,
      comentario,
      producto,
      fecha_inicio,
      fecha_fin,
    })
    return response(200, inventoryMovements, 'Done')
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
      id,
      company_id,
      product_id,
      user_id,
      movement_type,
      quantity,
      comment,
    } = body

    if (!id || !product_id || !movement_type || !quantity || !comment) {
      throw new Error('Missing required fields')
    }

    const inventoryMovement = await updateInventoryMovement({
      id,
      product_id,
      movement_type,
      quantity,
      comment,
    })

    if (!inventoryMovement) {
      throw new Error('Inventory movement not found')
    }

    return response(200, inventoryMovement, 'Done')
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
    console.log('🔍 inventoryMovement ID:', id)

    const inventoryMovement = await deleteInventoryMovement({ id })

    console.log('🔍 inventoryMovement:', inventoryMovement)
    return response(200, null, 'Done')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error ❌', error)
    return response(400, null, message)
  }
}
