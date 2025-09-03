'use strict'
const {
  getPurchases,
  createVenta,
  createDetalleVenta,
  updateVenta,
  verificarStockDisponible,
  cancelarVenta,
  crearMovimientoDevolucion,
  getVentaById,
  getDetallesVentaByVentaId,
  getPurchasesFlat,
  copiarDetallesVenta,
  updateVentaStatus,
  deleteVenta,
  updateSale,
} = require('./storage')
const {
  response,
  getBody,
} = require(`${process.env['FILE_ENVIRONMENT']}common/utils`)

module.exports.read = async event => {
  try {
    const {
      queryStringParameters: {
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
    } = event

    const purchases = await getPurchases({
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
    })
    return response(200, purchases, 'Done')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}

module.exports.readFlatSales = async event => {
  try {
    const {
      queryStringParameters: {
        empresa_id,
        id,
        cliente_nombre,
        cliente_nit,
        cliente_email,
        usuario_nombre,
        estado_venta,
        fecha_venta,
      },
    } = event

    const purchases = await getPurchasesFlat({
      empresa_id,
      id,
      cliente_nombre,
      cliente_nit,
      cliente_email,
      usuario_nombre,
      estado_venta,
      fecha_venta,
    })
    return response(200, purchases, 'Done')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}

module.exports.create = async event => {
  try {
    const body = getBody(event)
    const { empresa_id, cliente_id, usuario_id, total, estado, detalle } = body

    if (
      !empresa_id ||
      !cliente_id ||
      !usuario_id ||
      !total ||
      !estado ||
      !detalle
    ) {
      throw new Error('Missing required fields')
    }

    // Validar cada producto con fetchResultPg
    for (const item of detalle) {
      const result = await verificarStockDisponible({
        producto_id: item.producto_id,
      })

      if (!result) {
        throw new Error(`Producto ${item.producto_descripcion} no encontrado.`)
      }

      const { stock, estado: estadoProducto } = result

      if (estadoProducto !== 'activo') {
        throw new Error(`Producto ${item.producto_descripcion} está inactivo.`)
      }

      if (item.cantidad > stock) {
        throw new Error(
          `Stock insuficiente para el producto ${item.producto_descripcion}. Disponible: ${stock}, solicitado: ${item.cantidad}`
        )
      }
    }

    // Crear la venta
    const venta = await createVenta({
      empresa_id,
      cliente_id,
      usuario_id,
      total,
      estado,
    })

    // Insertar detalles
    for (const item of detalle) {
      await createDetalleVenta({
        venta_id: venta.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
      })
    }

    return response(200, venta, 'Venta creada correctamente')
  } catch (error) {
    console.log('error', error)
    return response(400, null, error.message || 'Error')
  }
}

module.exports.update = async event => {
  try {
    const body = getBody(event)
    const { venta_id, estado } = body

    if (!venta_id || !estado) {
      throw new Error('Missing required fields')
    }

    if (estado !== 'generado' && estado !== 'vendido') {
      throw new Error('Estado no válido')
    }

    // Verificar que la venta existe
    const ventaActual = await getVentaById({ venta_id })
    if (!ventaActual) {
      throw new Error('Venta no encontrada')
    }

    // Crear nueva venta
    const nuevaVenta = await updateVenta({ venta_id, estado })

    // Copiar detalles de la venta
    await copiarDetallesVenta({
      venta_id_original: venta_id,
      venta_id_nueva: nuevaVenta.id,
    })

    // Eliminar venta original
    await deleteVenta({ venta_id })

    return response(200, nuevaVenta, 'Venta actualizada correctamente')
  } catch (error) {
    console.log('error', error)
    return response(400, null, error.message || 'Error')
  }
}

module.exports.cancel = async event => {
  try {
    const body = getBody(event)
    const { venta_id } = body

    if (!venta_id) {
      throw new Error('Missing required fields')
    }

    // Obtener venta
    const venta = await getVentaById({ venta_id })

    if (!venta || venta.estado === 'cancelado') {
      throw new Error('La venta no existe o ya está cancelada')
    }

    // Obtener detalles
    const detalles = await getDetallesVentaByVentaId({ venta_id })

    // Cancelar venta
    await cancelarVenta({ venta_id })

    // Registrar devoluciones
    for (const detalle of detalles) {
      await crearMovimientoDevolucion({
        empresa_id: venta.empresa_id,
        producto_id: detalle.producto_id,
        usuario_id: venta.usuario_id,
        cantidad: detalle.cantidad,
        comentario: `Devolución al stock de productos por cancelación de venta`,
        referencia: venta_id,
      })
    }

    return response(200, { venta_id }, 'Venta cancelada correctamente')
  } catch (error) {
    console.log('error', error)
    return response(400, null, error.message || 'Error')
  }
}

module.exports.updateStatus = async event => {
  try {
    const body = getBody(event)
    const { venta_id, estado } = body

    if (!venta_id || !estado) {
      throw new Error('Missing required fields')
    }

    const venta = await updateVentaStatus({ venta_id, estado })

    return response(200, venta, 'Venta actualizada correctamente')
  } catch (error) {
    console.log('error', error)
    return response(400, null, error.message || 'Error')
  }
}

module.exports.updateSale = async event => {
  try {
    const body = getBody(event)
    const {
      venta_id,
      empresa_id,
      cliente_id,
      usuario_id,
      total,
      estado,
      detalle,
    } = body

    if (
      !venta_id ||
      !empresa_id ||
      !cliente_id ||
      !usuario_id ||
      !total ||
      !estado ||
      !detalle
    ) {
      throw new Error('Missing required fields')
    }

    // Verify the sale exists
    const existingVenta = await getVentaById({ venta_id })
    if (!existingVenta) {
      throw new Error('Venta no encontrada')
    }

    //cancelamos la venta anterior
    // Obtener detalles
    const detalles = await getDetallesVentaByVentaId({ venta_id })

    // Cancelar venta
    await cancelarVenta({ venta_id })

    // Registrar devoluciones
    for (const detalle of detalles) {
      await crearMovimientoDevolucion({
        empresa_id: existingVenta.empresa_id,
        producto_id: detalle.producto_id,
        usuario_id: existingVenta.usuario_id,
        cantidad: detalle.cantidad,
        comentario: `Devolución al stock de productos, se edito la informacion de la Venta`,
        referencia: venta_id,
      })
    }

    // Validar cada producto con fetchResultPg
    for (const item of detalles) {
      const result = await verificarStockDisponible({
        producto_id: item.producto_id,
      })

      if (!result) {
        throw new Error(`Producto ${item.producto_descripcion} no encontrado.`)
      }

      const { stock, estado: estadoProducto } = result

      if (estadoProducto !== 'activo') {
        throw new Error(`Producto ${item.producto_descripcion} está inactivo.`)
      }

      if (item.cantidad > stock) {
        throw new Error(
          `Stock insuficiente para el producto ${item.producto_descripcion}. Disponible: ${stock}, solicitado: ${item.cantidad}`
        )
      }
    }

    //eliminamos la venta anterior
    await deleteVenta({ venta_id })

    // Crear la venta
    const venta = await createVenta({
      empresa_id,
      cliente_id,
      usuario_id,
      total,
      estado,
    })

    // Insertar detalles
    for (const item of detalle) {
      await createDetalleVenta({
        venta_id: venta.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
      })
    }

    return response(200, venta, 'Venta actualizada correctamente')
  } catch (error) {
    console.log('error', error)
    return response(400, null, error.message || 'Error')
  }
}

module.exports.removeSale = async event => {
  try {
    const body = getBody(event)
    const { venta_id } = body

    if (!venta_id) {
      throw new Error('Missing required fields')
    }

    // Obtener venta
    const venta = await getVentaById({ venta_id })

    if (!venta || venta.estado !== 'cancelado') {
      // Obtener detalles
      const detalles = await getDetallesVentaByVentaId({ venta_id })

      // Registrar devoluciones
      for (const detalle of detalles) {
        await crearMovimientoDevolucion({
          empresa_id: venta.empresa_id,
          producto_id: detalle.producto_id,
          usuario_id: venta.usuario_id,
          cantidad: detalle.cantidad,
          comentario: `Devolución al stock de productos por eliminacion de la venta`,
          referencia: venta_id,
        })
      }
    }

    const ventaDeleted = await deleteVenta({ venta_id })

    return response(200, ventaDeleted, 'Venta eliminada')
  } catch (error) {
    console.log('error', error)
    return response(400, null, error.message || 'Error')
  }
}
