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
  createVentaPayment,
  getVentaPayments,
  updateVentaPayment,
  deleteVentaPayment,
  getVentaByIdWithPayments,
  sumPagosByVenta,
  createVentaPayments,
  getVentaWithPayments,
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
        tipo_precio_aplicado,
        fecha_inicio,
        fecha_fin,
        metodo_pago,
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
      tipo_precio_aplicado,
      fecha_inicio,
      fecha_fin,
      metodo_pago,
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
    const {
      empresa_id,
      cliente_id,
      usuario_id,
      total,
      estado,
      detalle,
      metodo_pago_id,
      moneda_id,
      moneda,
      referencia_pago,
      pagos, // New field for multiple payments
    } = body

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

    // Validar que si el estado es 'vendido', se requieren pagos
    if (estado === 'vendido') {
      if (!pagos || pagos.length === 0) {
        throw new Error(
          'Para ventas en estado "vendido" se requiere al menos un pago'
        )
      }

      // Validar que cada pago tenga metodo_pago_id y moneda_id
      for (const pago of pagos) {
        if (!pago.metodo_pago_id || !pago.moneda_id) {
          throw new Error('Cada pago debe tener metodo_pago_id y moneda_id')
        }
      }

      // Validar que la suma de pagos sea igual al total
      const totalPagos = pagos.reduce(
        (sum, pago) => sum + Number(pago.monto),
        0
      )
      if (Math.abs(totalPagos - Number(total)) > 0.01) {
        // Allow small floating point differences
        throw new Error('La suma de pagos debe ser igual al total de la venta')
      }
    }

    // Validar cada producto con fetchResultMysql
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

    // Crear la venta (sin pagos por ahora)
    const venta = await createVenta({
      empresa_id,
      cliente_id,
      usuario_id,
      total,
      estado,
      metodo_pago_id: null, // No longer store in ventas table
      moneda_id: null, // No longer store in ventas table
      moneda: null, // No longer store in ventas table
      referencia_pago: null, // No longer store in ventas table
    })

    // Insertar detalles
    for (const item of detalle) {
      await createDetalleVenta({
        venta_id: venta.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
        tipo_precio_aplicado: item.tipo_precio_aplicado,
      })
    }

    // Crear pagos si existen
    let pagosCreados = []
    if (pagos && pagos.length > 0) {
      pagosCreados = await createVentaPayments({
        venta_id: venta.id,
        pagos: pagos,
      })
    }

    // Obtener venta con información de pagos
    const ventaCompleta = await getVentaWithPayments({ ventaId: venta.id })
    const pagosList = await getVentaPayments({ ventaId: venta.id })

    return response(
      200,
      {
        ...ventaCompleta,
        pagos: pagosList,
      },
      'Venta creada correctamente'
    )
  } catch (error) {
    console.log('error', error)
    return response(400, null, error.message || 'Error')
  }
}

module.exports.update = async event => {
  try {
    const body = getBody(event)
    const {
      venta_id,
      estado,
      metodo_pago_id,
      moneda_id,
      moneda,
      referencia_pago,
      pagos, // New field for multiple payments
    } = body

    if (!venta_id || !estado) {
      throw new Error('Missing required fields')
    }

    if (estado !== 'generado' && estado !== 'vendido') {
      throw new Error('Estado no válido')
    }

    // Validar que si el estado es 'vendido', se requieren pagos
    if (estado === 'vendido') {
      if (!pagos || pagos.length === 0) {
        throw new Error(
          'Para ventas en estado "vendido" se requiere al menos un pago'
        )
      }

      // Validar que cada pago tenga metodo_pago_id y moneda_id
      for (const pago of pagos) {
        if (!pago.metodo_pago_id || !pago.moneda_id) {
          throw new Error('Cada pago debe tener metodo_pago_id y moneda_id')
        }
      }

      // Validar que la suma de pagos sea igual al total
      const ventaActual = await getVentaById({ venta_id })
      if (!ventaActual) {
        throw new Error('Venta no encontrada')
      }

      const totalPagos = pagos.reduce(
        (sum, pago) => sum + Number(pago.monto),
        0
      )
      if (Math.abs(totalPagos - Number(ventaActual.total)) > 0.01) {
        throw new Error('La suma de pagos debe ser igual al total de la venta')
      }
    }

    // Verificar que la venta existe
    const ventaActual = await getVentaById({ venta_id })
    if (!ventaActual) {
      throw new Error('Venta no encontrada')
    }

    // Crear nueva venta
    const nuevaVenta = await updateVenta({
      venta_id,
      estado,
      metodo_pago_id: null, // No longer store in ventas table
      moneda_id: null, // No longer store in ventas table
      moneda: null, // No longer store in ventas table
      referencia_pago: null, // No longer store in ventas table
    })

    // Copiar detalles de la venta
    await copiarDetallesVenta({
      venta_id_original: venta_id,
      venta_id_nueva: nuevaVenta.id,
    })

    // Crear pagos si existen
    if (pagos && pagos.length > 0) {
      await createVentaPayments({
        venta_id: nuevaVenta.id,
        pagos: pagos,
      })
    }

    // Eliminar venta original
    await deleteVenta({ venta_id })

    // Obtener venta con información de pagos
    const ventaCompleta = await getVentaWithPayments({ ventaId: nuevaVenta.id })
    const pagosList = await getVentaPayments({ ventaId: nuevaVenta.id })

    return response(
      200,
      {
        ...ventaCompleta,
        pagos: pagosList,
      },
      'Venta actualizada correctamente'
    )
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

    if (estado === 'vendido') {
      const venta = await getVentaByIdWithPayments({ ventaId: venta_id })
      if (!venta) return response(404, null, 'Venta no encontrada')
      const pagos = await getVentaPayments({ ventaId: venta_id })
      const totalPagado = pagos.reduce((s, p) => s + Number(p.monto), 0)
      if (pagos.length === 0)
        return response(
          422,
          null,
          'No se puede marcar como vendido: la venta no tiene pagos.'
        )
      if (Math.abs(totalPagado - Number(venta.total)) > 0.01)
        return response(
          422,
          null,
          'No se puede marcar como vendido: la suma de pagos no coincide con el total.'
        )
    }
    const venta = await updateVentaStatus({ venta_id, estado })

    return response(200, venta, 'Venta actualizada correctamente')
  } catch (error) {
    console.log('error', error)
    const isSignal =
      error &&
      (error.sqlState === '45000' || error.code === 'ER_SIGNAL_EXCEPTION')
    return response(isSignal ? 422 : 400, null, error.message || 'Error')
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
      metodo_pago_id,
      moneda_id,
      moneda,
      referencia_pago,
      pagos, // New field for multiple payments
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

    // Validar que si el estado es 'vendido', se requieren pagos
    if (estado === 'vendido') {
      if (!pagos || pagos.length === 0) {
        throw new Error(
          'Para ventas en estado "vendido" se requiere al menos un pago'
        )
      }

      // Validar que cada pago tenga metodo_pago_id y moneda_id
      for (const pago of pagos) {
        if (!pago.metodo_pago_id || !pago.moneda_id) {
          throw new Error('Cada pago debe tener metodo_pago_id y moneda_id')
        }
      }

      // Validar que la suma de pagos sea igual al total
      const totalPagos = pagos.reduce(
        (sum, pago) => sum + Number(pago.monto),
        0
      )
      if (Math.abs(totalPagos - Number(total)) > 0.01) {
        throw new Error('La suma de pagos debe ser igual al total de la venta')
      }
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

    // Validar cada producto con fetchResultMysql
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

    //eliminamos la venta anterior
    await deleteVenta({ venta_id })

    // Crear la venta (sin pagos por ahora)
    const venta = await createVenta({
      empresa_id,
      cliente_id,
      usuario_id,
      total,
      estado,
      metodo_pago_id: null, // No longer store in ventas table
      moneda_id: null, // No longer store in ventas table
      moneda: null, // No longer store in ventas table
      referencia_pago: null, // No longer store in ventas table
    })

    // Insertar detalles
    for (const item of detalle) {
      await createDetalleVenta({
        venta_id: venta.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
        tipo_precio_aplicado: item.tipo_precio_aplicado,
      })
    }

    // Crear pagos si existen
    if (pagos && pagos.length > 0) {
      await createVentaPayments({
        venta_id: venta.id,
        pagos: pagos,
      })
    }

    // Obtener venta con información de pagos
    const ventaCompleta = await getVentaWithPayments({ ventaId: venta.id })
    const pagosList = await getVentaPayments({ ventaId: venta.id })

    return response(
      200,
      {
        ...ventaCompleta,
        pagos: pagosList,
      },
      'Venta actualizada correctamente'
    )
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

// Payment handlers
module.exports.createPayment = async event => {
  try {
    const { ventaId } = event.pathParameters || {}
    const body = getBody(event)
    const { metodo_pago_id, moneda_id, monto, referencia_pago = null } = body

    if (!ventaId || !metodo_pago_id || !moneda_id || monto == null) {
      throw new Error('Missing required fields')
    }

    // Validación: no exceder total de la venta
    const { total, estado } = await getVentaByIdWithPayments({ ventaId })
    if (estado === 'vendido') {
      return response(
        422,
        null,
        'No puede modificar pagos de una venta ya vendida.'
      )
    }
    const pagado = await sumPagosByVenta({ ventaId })
    if (Number(pagado) + Number(monto) > Number(total)) {
      throw new Error('La suma de pagos excede el total de la venta')
    }

    const pago = await createVentaPayment({
      venta_id: ventaId,
      metodo_pago_id,
      moneda_id,
      monto,
      referencia_pago,
    })
    return response(201, pago, 'Pago creado correctamente')
  } catch (err) {
    console.log('createPayment error', err)
    const isSignal =
      err && (err.sqlState === '45000' || err.code === 'ER_SIGNAL_EXCEPTION')
    return response(isSignal ? 422 : 400, null, err.message || 'Error')
  }
}

module.exports.listPayments = async event => {
  try {
    const { ventaId } = event.pathParameters || {}
    if (!ventaId) throw new Error('Missing ventaId')
    const pagos = await getVentaPayments({ ventaId })
    return response(200, pagos, 'Done')
  } catch (err) {
    console.log('listPayments error', err)
    const isSignal =
      err && (err.sqlState === '45000' || err.code === 'ER_SIGNAL_EXCEPTION')
    return response(isSignal ? 422 : 400, null, err.message || 'Error')
  }
}

module.exports.updatePayment = async event => {
  try {
    const { ventaId, paymentId } = event.pathParameters || {}
    const body = getBody(event)
    const { metodo_pago_id, moneda_id, monto, referencia_pago } = body

    if (!ventaId || !paymentId) throw new Error('Missing ventaId/paymentId')

    // Validar no exceda el total (considerando el cambio)
    const { total, estado } = await getVentaByIdWithPayments({ ventaId })
    if (estado === 'vendido') {
      return response(
        422,
        null,
        'No puede modificar pagos de una venta ya vendida.'
      )
    }
    const pagadoSinEste = await sumPagosByVenta({
      ventaId,
      excludePaymentId: paymentId,
    })
    if (
      monto != null &&
      Number(pagadoSinEste) + Number(monto) > Number(total)
    ) {
      throw new Error('La suma de pagos excede el total de la venta')
    }

    const pago = await updateVentaPayment({
      id: paymentId,
      venta_id: ventaId,
      metodo_pago_id,
      moneda_id,
      monto,
      referencia_pago,
    })
    return response(200, pago, 'Pago actualizado correctamente')
  } catch (err) {
    console.log('updatePayment error', err)
    const isSignal =
      err && (err.sqlState === '45000' || err.code === 'ER_SIGNAL_EXCEPTION')
    return response(isSignal ? 422 : 400, null, err.message || 'Error')
  }
}

module.exports.deletePayment = async event => {
  try {
    const { ventaId, paymentId } = event.pathParameters || {}
    if (!ventaId || !paymentId) throw new Error('Missing ventaId/paymentId')
    const venta = await getVentaByIdWithPayments({ ventaId })
    if (!venta) return response(404, null, 'Venta no encontrada')
    if (venta.estado === 'vendido') {
      return response(
        422,
        null,
        'No puede modificar pagos de una venta ya vendida.'
      )
    }
    const pago = await deleteVentaPayment({ id: paymentId, venta_id: ventaId })
    return response(200, pago, 'Pago eliminado correctamente')
  } catch (err) {
    console.log('deletePayment error', err)
    const isSignal =
      err && (err.sqlState === '45000' || err.code === 'ER_SIGNAL_EXCEPTION')
    return response(isSignal ? 422 : 400, null, err.message || 'Error')
  }
}
