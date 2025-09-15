const {
  fetchResultMysql,
} = require(`${process.env['FILE_ENVIRONMENT']}common/db`)

const getMonedas = fetchResultMysql(
  ({ activo }, connection) =>
    connection.execute(
      `
      SELECT * FROM monedas
      WHERE (? IS NULL OR activo = ?)
      ORDER BY codigo ASC
      `,
      [activo || null, activo || null]
    ),
  { singleResult: false }
)

const createMoneda = fetchResultMysql(
  async (
    { codigo, nombre, simbolo, decimales = 2, activo = true },
    connection
  ) => {
    await connection.execute(
      `
      INSERT INTO monedas (codigo, nombre, simbolo, decimales, activo)
      VALUES (?, ?, ?, ?, ?)
      `,
      [codigo, nombre, simbolo, decimales, activo]
    )
    const [result] = await connection.execute(
      'SELECT * FROM monedas WHERE id = LAST_INSERT_ID()'
    )
    return result
  },
  { singleResult: true }
)

const updateMoneda = fetchResultMysql(
  async ({ id, codigo, nombre, simbolo, decimales, activo }, connection) => {
    await connection.execute(
      `
      UPDATE monedas 
      SET codigo = COALESCE(?, codigo),
          nombre = COALESCE(?, nombre),
          simbolo = COALESCE(?, simbolo),
          decimales = COALESCE(?, decimales),
          activo = COALESCE(?, activo)
      WHERE id = ?
      `,
      [codigo, nombre, simbolo, decimales, activo, id]
    )
    const [result] = await connection.execute(
      'SELECT * FROM monedas WHERE id = ?',
      [id]
    )
    return result
  },
  { singleResult: true }
)

const deleteMoneda = fetchResultMysql(
  async ({ id }, connection) => {
    // First, get the record before deleting it
    const [existingRecord] = await connection.execute(
      'SELECT * FROM monedas WHERE id = ?',
      [id]
    )

    if (existingRecord.length === 0) {
      throw new Error('Moneda no encontrada')
    }

    // Delete the record
    await connection.execute(`DELETE FROM monedas WHERE id = ?`, [id])

    // Return the deleted record
    return existingRecord
  },
  { singleResult: true }
)

module.exports = {
  getMonedas,
  createMoneda,
  updateMoneda,
  deleteMoneda,
}
