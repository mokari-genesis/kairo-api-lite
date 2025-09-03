const {
  fetchResultMysql,
} = require(`${process.env['FILE_ENVIRONMENT']}common/db`)

const createProvider = fetchResultMysql(
  async (
    { empresa_id, nombre, nit, email, telefono, direccion, tipo },
    connection
  ) => {
    await connection.execute(
      `
      INSERT INTO proveedores (
        empresa_id, nombre, nit, email, telefono, direccion, tipo
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [empresa_id, nombre, nit, email, telefono, direccion, tipo]
    )
    const [result] = await connection.execute(
      'SELECT * FROM proveedores WHERE id = LAST_INSERT_ID()'
    )
    return result
  },
  { singleResult: true }
)

const getProviders = fetchResultMysql(
  ({ nombre, nit, direccion, telefono, email, tipo, empresa_id }, connection) =>
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
        nombre || null,
        nombre || null,
        nit || null,
        nit || null,
        email || null,
        email || null,
        telefono || null,
        telefono || null,
        direccion || null,
        direccion || null,
        tipo || null,
        tipo || null,
      ]
    ),
  { singleResult: false }
)

const updateProvider = fetchResultMysql(
  async ({ id, nombre, nit, email, telefono, direccion, tipo }, connection) => {
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
      [nombre, nit, email, telefono, direccion, tipo, id]
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
