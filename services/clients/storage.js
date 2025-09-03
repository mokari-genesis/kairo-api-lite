const {
  fetchResultMysql,
} = require(`${process.env['FILE_ENVIRONMENT']}common/db`)

const getClients = fetchResultMysql(
  ({ name, email, phone, address, empresa_id, type, nit }, connection) => {
    // Convert undefined values to null for MySQL compatibility
    const params = [
      empresa_id || null,
      empresa_id || null,
      name || null,
      name || null,
      email || null,
      email || null,
      phone || null,
      phone || null,
      address || null,
      address || null,
      type || null,
      type || null,
      nit || null,
      nit || null,
    ]

    return connection.execute(
      `SELECT * FROM clientes 
    WHERE (? IS NULL OR empresa_id = ?)
    AND (? IS NULL OR nombre LIKE CONCAT('%', ?, '%'))
    AND (? IS NULL OR email LIKE CONCAT('%', ?, '%'))
    AND (? IS NULL OR telefono LIKE CONCAT('%', ?, '%'))
    AND (? IS NULL OR direccion LIKE CONCAT('%', ?, '%'))    
    AND (? IS NULL OR tipo = ?)
    AND (? IS NULL OR nit = ?)`,
      params
    )
  }
)

const createClient = fetchResultMysql(
  async (
    { empresa_id, name, type, nit, email, phone, address },
    connection
  ) => {
    await connection.execute(
      `
      INSERT INTO clientes (
        empresa_id, nombre, tipo, nit, email, telefono, direccion
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [empresa_id, name, type, nit, email, phone, address]
    )
    const [result] = await connection.execute(
      'SELECT * FROM clientes WHERE id = LAST_INSERT_ID()'
    )
    return result
  },
  { singleResult: true }
)

const deleteClient = fetchResultMysql(({ id }, connection) => {
  return connection.execute(`DELETE FROM clientes WHERE id = ?`, [id])
})

const updateClient = fetchResultMysql(
  async ({ id, name, type, nit, email, phone, address }, connection) => {
    await connection.execute(
      `
      UPDATE clientes
      SET nombre = ?,
          tipo = ?,
          nit = ?,
          email = ?,
          telefono = ?,
          direccion = ?
      WHERE id = ?
      `,
      [name, type, nit, email, phone, address, id]
    )
    const [result] = await connection.execute(
      'SELECT * FROM clientes WHERE id = ?',
      [id]
    )
    return result
  },
  { singleResult: true }
)
module.exports = {
  getClients,
  createClient,
  deleteClient,
  updateClient,
}
