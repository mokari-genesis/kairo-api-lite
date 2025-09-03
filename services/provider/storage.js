const {
  fetchResultMysql,
} = require(`${process.env['FILE_ENVIRONMENT']}common/db`)

const createProvider = fetchResultMysql(
  async (
    { empresa_id, name, nit, email, phone, address, type },
    connection
  ) => {
    await connection.execute(
      `
      INSERT INTO proveedores (
        empresa_id, nombre, nit, email, telefono, direccion, tipo
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [empresa_id, name, nit, email, phone, address, type]
    )
    const [result] = await connection.execute(
      'SELECT * FROM proveedores WHERE id = LAST_INSERT_ID()'
    )
    return result
  },
  { singleResult: true }
)

const getProviders = fetchResultMysql(
  ({ name, nit, email, phone, address, empresa_id, type }, connection) =>
    connection.execute(
      `
      SELECT * FROM proveedores 
      WHERE (? IS NULL OR empresa_id = ?)
      AND (? IS NULL OR nombre LIKE CONCAT('%', ?, '%'))
      AND (? IS NULL OR nit LIKE CONCAT('%', ?, '%'))
      AND (? IS NULL OR email LIKE CONCAT('%', ?, '%'))
      AND (? IS NULL OR telefono LIKE CONCAT('%', ?, '%'))
      AND (? IS NULL OR direccion LIKE CONCAT('%', ?, '%'))
      AND (? IS NULL OR tipo = ?)
      `,
      [
        empresa_id || null,
        empresa_id || null,
        name || null,
        name || null,
        nit || null,
        nit || null,
        email || null,
        email || null,
        phone || null,
        phone || null,
        address || null,
        address || null,
        type || null,
        type || null,
      ]
    ),
  { singleResult: false }
)

const updateProvider = fetchResultMysql(
  async ({ id, name, nit, email, phone, address, type }, connection) => {
    await connection.execute(
      `
      UPDATE proveedores
      SET nombre = ?,
          nit = ?,
          email = ?,
          telefono = ?,
          direccion = ?,
          tipo = ?
      WHERE id = ?
      `,
      [name, nit, email, phone, address, type, id]
    )
    const [result] = await connection.execute(
      'SELECT * FROM proveedores WHERE id = ?',
      [id]
    )
    return result
  },
  { singleResult: true }
)

const deleteProvider = fetchResultMysql(
  async ({ id }, connection) => {
    // First, get the record before deleting it
    const [existingRecord] = await connection.execute(
      'SELECT * FROM proveedores WHERE id = ?',
      [id]
    )

    if (existingRecord.length === 0) {
      throw new Error('Provider not found')
    }

    // Delete the record
    await connection.execute(
      `
      DELETE FROM proveedores
      WHERE id = ?
      `,
      [id]
    )

    // Return the deleted record
    return existingRecord
  },
  { singleResult: true }
)

module.exports = {
  createProvider,
  getProviders,
  updateProvider,
  deleteProvider,
}
