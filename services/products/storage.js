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

module.exports = {
  getProducts,
  createProduct,
  deleteProducts,
  updateProduct,
}
