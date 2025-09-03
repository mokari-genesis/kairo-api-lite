const { fetchResultPg } = require(`${process.env['FILE_ENVIRONMENT']}common/db`)

const getClients = fetchResultPg(
  ({ name, email, phone, address, empresa_id, type, nit }, request) => {
    return request.query(
      `SELECT * FROM clientes 
    WHERE ($5::INT IS NULL OR empresa_id = $5)
    AND ($1::TEXT IS NULL OR nombre ILIKE '%' || $1 || '%')
    AND ($2::TEXT IS NULL OR email ILIKE '%' || $2 || '%')
    AND ($3::TEXT IS NULL OR telefono ILIKE '%' || $3 || '%')
    AND ($4::TEXT IS NULL OR direccion ILIKE '%' || $4 || '%')    
    AND ($6::TEXT IS NULL OR tipo = $6)
    AND ($7::TEXT IS NULL OR nit = $7)`,
      [name, email, phone, address, empresa_id, type, nit]
    )
  }
)

const createClient = fetchResultPg(
  ({ empresa_id, name, type, nit, email, phone, address }, request) =>
    request.query(
      `
      INSERT INTO clientes (
        empresa_id, nombre, tipo, nit, email, telefono, direccion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [empresa_id, name, type, nit, email, phone, address]
    ),
  { singleResult: true }
)

const deleteClient = fetchResultPg(({ id }, request) => {
  return request.query(`DELETE FROM clientes WHERE id = $1`, [id])
})

const updateClient = fetchResultPg(
  ({ id, name, type, nit, email, phone, address }, request) =>
    request.query(
      `
      UPDATE clientes
      SET nombre = $2,
          tipo = $3,
          nit = $4,
          email = $5,
          telefono = $6,
          direccion = $7
      WHERE id = $1
      RETURNING *
      `,
      [id, name, type, nit, email, phone, address]
    ),
  { singleResult: true }
)
module.exports = {
  getClients,
  createClient,
  deleteClient,
  updateClient,
}
