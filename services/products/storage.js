const {
  fetchResultMysql,
} = require(`${process.env['FILE_ENVIRONMENT']}common/db`)

const getProducts = fetchResultMysql(
  (
    {
      empresa_id,
      product_id,
      codigo,
      serie,
      descripcion,
      categoria,
      estado,
      stock,
      nombre_proveedor,
    },
    connection
  ) =>
    connection.execute(
      `
        SELECT p.*, pr.nombre as nombre_proveedor
        FROM productos p
        LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
        WHERE p.empresa_id = ?
          AND (? IS NULL OR p.id = ?)  
          AND (? IS NULL OR p.codigo = ?)
          AND (? IS NULL OR p.serie = ?)
          AND (? IS NULL OR p.descripcion LIKE CONCAT('%', ?, '%'))
          AND (? IS NULL OR p.categoria = ?)
          AND (? IS NULL OR p.estado = ?)
          AND (? IS NULL OR p.stock = ?)
          AND (? IS NULL OR pr.nombre LIKE CONCAT('%', ?, '%'))
          ORDER BY p.fecha_creacion DESC
        `,
      [
        empresa_id,
        product_id ?? null,
        product_id ?? null,
        codigo ?? null,
        codigo ?? null,
        serie ?? null,
        serie ?? null,
        descripcion ?? null,
        descripcion ?? null,
        categoria ?? null,
        categoria ?? null,
        estado ?? null,
        estado ?? null,
        stock ?? null,
        stock ?? null,
        nombre_proveedor ?? null,
        nombre_proveedor ?? null,
      ]
    )
)

const createProduct = fetchResultMysql(
  async (
    {
      empresa_id,
      codigo,
      serie,
      descripcion,
      categoria,
      estado = 'activo',
      stock = 0,
      precio = 0,
      proveedor_id,
    },
    connection
  ) => {
    await connection.execute(
      `
      INSERT INTO productos (
        empresa_id,
        codigo,
        serie,
        descripcion,
        categoria,
        estado,
        stock,
        precio,
        proveedor_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        empresa_id,
        codigo,
        serie,
        descripcion,
        categoria,
        estado,
        stock,
        precio,
        proveedor_id,
      ]
    )
    const [result] = await connection.execute(
      `
      SELECT p.*, pr.nombre as nombre_proveedor
      FROM productos p
      LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
      WHERE p.id = LAST_INSERT_ID()
      `
    )
    return result
  },
  { singleResult: true }
)

const deleteProducts = fetchResultMysql(async ({ product_ids }, connection) => {
  const ids = Array.isArray(product_ids) ? product_ids : [product_ids]
  const placeholders = ids.map(() => '?').join(',')
  await connection.execute(
    `
    DELETE FROM productos 
    WHERE id IN (${placeholders})
    `,
    ids
  )
  const [result] = await connection.execute(
    `SELECT * FROM productos WHERE id IN (${placeholders})`,
    ids
  )
  return result
})

const updateProduct = fetchResultMysql(
  async (
    {
      product_id,
      empresa_id,
      codigo,
      serie,
      descripcion,
      categoria,
      estado,
      stock,
      proveedor_id,
    },
    connection
  ) => {
    await connection.execute(
      `
    UPDATE productos 
    SET codigo = ?, 
    serie = ?, 
    descripcion = ?,
    categoria = ?, 
    estado = ?, 
    stock = ?,
    proveedor_id = ?
    WHERE id = ? AND empresa_id = ?
    `,
      [
        codigo,
        serie,
        descripcion,
        categoria,
        estado,
        stock,
        proveedor_id,
        product_id,
        empresa_id,
      ]
    )
    const [result] = await connection.execute(
      `
      SELECT p.*, pr.nombre as nombre_proveedor
      FROM productos p
      LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
      WHERE p.id = ? AND p.empresa_id = ?
      `,
      [product_id, empresa_id]
    )
    return result
  }
)

const getProductosPrecios = fetchResultMysql(
  ({ producto_id, tipo }, connection) =>
    connection.execute(
      `
      SELECT pp.*, p.codigo as producto_codigo, p.descripcion as producto_descripcion
      FROM productos_precios pp
      LEFT JOIN productos p ON pp.producto_id = p.id
      WHERE (? IS NULL OR pp.producto_id = ?)
        AND (? IS NULL OR pp.tipo = ?)
      ORDER BY pp.producto_id, pp.tipo
      `,
      [producto_id || null, producto_id || null, tipo || null, tipo || null]
    ),
  { singleResult: false }
)

const createProductoPrecio = fetchResultMysql(
  async ({ producto_id, tipo, precio }, connection) => {
    await connection.execute(
      `
      INSERT INTO productos_precios (producto_id, tipo, precio)
      VALUES (?, ?, ?)
      `,
      [producto_id, tipo, precio]
    )
    const [result] = await connection.execute(
      `
      SELECT pp.*, p.codigo as producto_codigo, p.descripcion as producto_descripcion
      FROM productos_precios pp
      LEFT JOIN productos p ON pp.producto_id = p.id
      WHERE pp.id = LAST_INSERT_ID()
      `
    )
    return result
  },
  { singleResult: true }
)

const updateProductoPrecio = fetchResultMysql(
  async ({ id, precio }, connection) => {
    await connection.execute(
      `
      UPDATE productos_precios 
      SET precio = ?
      WHERE id = ?
      `,
      [precio, id]
    )
    const [result] = await connection.execute(
      `
      SELECT pp.*, p.codigo as producto_codigo, p.descripcion as producto_descripcion
      FROM productos_precios pp
      LEFT JOIN productos p ON pp.producto_id = p.id
      WHERE pp.id = ?
      `,
      [id]
    )
    return result
  },
  { singleResult: true }
)

const deleteProductoPrecio = fetchResultMysql(
  async ({ id }, connection) => {
    // First, get the record before deleting it
    const [existingRecord] = await connection.execute(
      `
      SELECT pp.*, p.codigo as producto_codigo, p.descripcion as producto_descripcion
      FROM productos_precios pp
      LEFT JOIN productos p ON pp.producto_id = p.id
      WHERE pp.id = ?
      `,
      [id]
    )

    if (existingRecord.length === 0) {
      throw new Error('Precio de producto no encontrado')
    }

    // Delete the record
    await connection.execute(`DELETE FROM productos_precios WHERE id = ?`, [id])

    // Return the deleted record
    return existingRecord
  },
  { singleResult: true }
)

module.exports = {
  getProducts,
  createProduct,
  deleteProducts,
  updateProduct,
  getProductosPrecios,
  createProductoPrecio,
  updateProductoPrecio,
  deleteProductoPrecio,
}
