const {
  fetchResultMysql,
} = require(`${process.env['FILE_ENVIRONMENT']}common/db`)

const getMetodosPago = fetchResultMysql(
  ({ activo, nombre }, connection) =>
    connection.execute(
      `
      SELECT * FROM metodos_pago
      WHERE (? IS NULL OR activo = ?)
      AND (? IS NULL OR nombre LIKE CONCAT('%', ?, '%'))
      ORDER BY nombre ASC
      `,
      [activo || null, activo || null, nombre || null, nombre || null]
    ),
  { singleResult: false }
)

const createMetodoPago = fetchResultMysql(
  async ({ nombre, activo = true }, connection) => {
    await connection.execute(
      `
      INSERT INTO metodos_pago (nombre, activo)
      VALUES (?, ?)
      `,
      [nombre, activo]
    )
    const [result] = await connection.execute(
      'SELECT * FROM metodos_pago WHERE id = LAST_INSERT_ID()'
    )
    return result
  },
  { singleResult: true }
)

const updateMetodoPago = fetchResultMysql(
  async ({ id, nombre, activo }, connection) => {
    await connection.execute(
      `
      UPDATE metodos_pago 
      SET nombre = COALESCE(?, nombre),
          activo = COALESCE(?, activo)
      WHERE id = ?
      `,
      [nombre, activo, id]
    )
    const [result] = await connection.execute(
      'SELECT * FROM metodos_pago WHERE id = ?',
      [id]
    )
    return result
  },
  { singleResult: true }
)

const deleteMetodoPago = fetchResultMysql(
  async ({ id }, connection) => {
    // First, get the record before deleting it
    const [existingRecord] = await connection.execute(
      'SELECT * FROM metodos_pago WHERE id = ?',
      [id]
    )

    if (existingRecord.length === 0) {
      throw new Error('Método de pago no encontrado')
    }

    // Delete the record
    await connection.execute(`DELETE FROM metodos_pago WHERE id = ?`, [id])

    // Return the deleted record
    return existingRecord
  },
  { singleResult: true }
)

module.exports = {
  getMetodosPago,
  createMetodoPago,
  updateMetodoPago,
  deleteMetodoPago,
}
