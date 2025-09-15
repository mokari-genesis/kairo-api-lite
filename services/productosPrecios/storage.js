const {
  fetchResultMysql,
} = require(`${process.env['FILE_ENVIRONMENT']}common/db`)

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

const getPreciosByProducto = fetchResultMysql(
  ({ producto_id }, connection) =>
    connection.execute(
      `
      SELECT pp.*, p.codigo as producto_codigo, p.descripcion as producto_descripcion
      FROM productos_precios pp
      LEFT JOIN productos p ON pp.producto_id = p.id
      WHERE pp.producto_id = ?
      ORDER BY pp.tipo
      `,
      [producto_id]
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
  getProductosPrecios,
  createProductoPrecio,
  updateProductoPrecio,
  deleteProductoPrecio,
  getPreciosByProducto,
}
