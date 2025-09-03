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
    },
    connection
  ) =>
    connection.execute(
      `
        SELECT * FROM productos
        WHERE empresa_id = ?
          AND (? IS NULL OR id = ?)  
          AND (? IS NULL OR codigo = ?)
          AND (? IS NULL OR serie = ?)
          AND (? IS NULL OR descripcion LIKE CONCAT('%', ?, '%'))
          AND (? IS NULL OR categoria = ?)
          AND (? IS NULL OR estado = ?)
          AND (? IS NULL OR stock = ?)
          ORDER BY fecha_creacion DESC
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
        precio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [empresa_id, codigo, serie, descripcion, categoria, estado, stock, precio]
    )
    const [result] = await connection.execute(
      'SELECT * FROM productos WHERE id = LAST_INSERT_ID()'
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
    stock = ?
    WHERE id = ? AND empresa_id = ?
    `,
      [
        codigo,
        serie,
        descripcion,
        categoria,
        estado,
        stock,
        product_id,
        empresa_id,
      ]
    )
    const [result] = await connection.execute(
      'SELECT * FROM productos WHERE id = ? AND empresa_id = ?',
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
