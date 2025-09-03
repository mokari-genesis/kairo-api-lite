const { fetchResultPg } = require(`${process.env['FILE_ENVIRONMENT']}common/db`)

const getProducts = fetchResultPg(
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
    request
  ) =>
    request.query(
      `
        SELECT * FROM productos
        WHERE empresa_id = $1
          AND ($2::INT IS NULL OR id = $2)  
          AND ($3::TEXT IS NULL OR codigo = $3)
          AND ($4::TEXT IS NULL OR serie = $4)
          AND ($5::TEXT IS NULL OR descripcion ILIKE '%' || $5 || '%')
          AND ($6::TEXT IS NULL OR categoria = $6)
          AND ($7::TEXT IS NULL OR estado = $7)
          AND ($8::INT IS NULL OR stock = $8)
          ORDER BY fecha_creacion DESC
        `,
      [
        empresa_id,
        product_id ?? null,
        codigo ?? null,
        serie ?? null,
        descripcion ?? null,
        categoria ?? null,
        estado ?? null,
        stock ?? null,
      ]
    )
)

const createProduct = fetchResultPg(
  (
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
    request
  ) =>
    request.query(
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [empresa_id, codigo, serie, descripcion, categoria, estado, stock, precio]
    ),
  { singleResult: true }
)

const deleteProducts = fetchResultPg(({ product_ids }, request) => {
  const ids = Array.isArray(product_ids) ? product_ids : [product_ids]
  return request.query(
    `
    DELETE FROM productos 
    WHERE id = ANY($1::int[])
    RETURNING *
    `,
    [ids]
  )
})

const updateProduct = fetchResultPg(
  (
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
    request
  ) => {
    return request.query(
      `
    UPDATE productos 
    SET codigo = $2, 
    serie = $3, 
    descripcion = $4,
    categoria = $5, 
    estado = $6, 
    stock = $7
    WHERE id = $8 AND empresa_id = $1
    RETURNING *
  `,
      [
        empresa_id,
        codigo,
        serie,
        descripcion,
        categoria,
        estado,
        stock,
        product_id,
      ]
    )
  }
)

module.exports = {
  getProducts,
  createProduct,
  deleteProducts,
  updateProduct,
}
