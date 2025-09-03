const {
  fetchResultMysql,
} = require(`${process.env['FILE_ENVIRONMENT']}common/db`)

const getEmpresas = fetchResultMysql(
  ({ nombre, nit, direccion, telefono, email }, connection) =>
    connection.execute(
      `
        SELECT *
        FROM empresas
        WHERE (? IS NULL OR nombre LIKE CONCAT('%', ?, '%'))
        AND (? IS NULL OR nit LIKE CONCAT('%', ?, '%'))
        AND (? IS NULL OR direccion LIKE CONCAT('%', ?, '%'))
        AND (? IS NULL OR telefono LIKE CONCAT('%', ?, '%'))
        AND (? IS NULL OR email LIKE CONCAT('%', ?, '%'))
        `,
      [
        nombre ?? null,
        nombre ?? null,
        nit ?? null,
        nit ?? null,
        direccion ?? null,
        direccion ?? null,
        telefono ?? null,
        telefono ?? null,
        email ?? null,
        email ?? null,
      ]
    ),
  { singleResult: false }
)

const createEmpresa = fetchResultMysql(
  async ({ nombre, nit, direccion, telefono, email }, connection) => {
    await connection.execute(
      `
        INSERT INTO empresas (nombre, nit, direccion, telefono, email)
        VALUES (?, ?, ?, ?, ?)
        `,
      [nombre, nit, direccion, telefono, email]
    )
    const [result] = await connection.execute(
      'SELECT * FROM empresas WHERE id = LAST_INSERT_ID()'
    )
    return result
  },
  { singleResult: true }
)

const deleteEmpresa = fetchResultMysql(
  async ({ id }, connection) => {
    // First, get the record before deleting it
    const [existingRecord] = await connection.execute(
      'SELECT * FROM empresas WHERE id = ?',
      [id]
    )

    if (existingRecord.length === 0) {
      throw new Error('Empresa not found')
    }

    // Delete the record
    await connection.execute(`DELETE FROM empresas WHERE id = ?`, [id])

    // Return the deleted record
    return existingRecord
  },
  { singleResult: true }
)

const updateEmpresa = fetchResultMysql(
  async ({ id, nombre, nit, direccion, telefono, email }, connection) => {
    await connection.execute(
      `
        UPDATE empresas
        SET nombre = ?, nit = ?, direccion = ?, telefono = ?, email = ?
        WHERE id = ?
        `,
      [nombre, nit, direccion, telefono, email, id]
    )
    const [result] = await connection.execute(
      'SELECT * FROM empresas WHERE id = ?',
      [id]
    )
    return result
  },
  { singleResult: true }
)

module.exports = {
  createEmpresa,
  getEmpresas,
  deleteEmpresa,
  updateEmpresa,
}
