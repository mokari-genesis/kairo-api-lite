const { fetchResultPg } = require(`${process.env['FILE_ENVIRONMENT']}common/db`)

const getEmpresas = fetchResultPg(
  ({ nombre, nit, direccion, telefono, email }, request) =>
    request.query(
      `
        SELECT *
        FROM empresas
        WHERE ($1::TEXT IS NULL OR nombre like '%' || $1 || '%')
        AND ($2::TEXT IS NULL OR nit like '%' || $2 || '%')
        AND ($3::TEXT IS NULL OR direccion like '%' || $3 || '%')
        AND ($4::TEXT IS NULL OR telefono like '%' || $4 || '%')
        AND ($5::TEXT IS NULL OR email like '%' || $5 || '%')
        `,
      [
        nombre ?? null,
        nit ?? null,
        direccion ?? null,
        telefono ?? null,
        email ?? null,
      ]
    ),
  { singleResult: false }
);

const createEmpresa = fetchResultPg(
  ({ nombre, nit, direccion, telefono, email }, request) =>
    request.query(
      `
        INSERT INTO empresas (nombre, nit, direccion, telefono, email)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `,
      [nombre, nit, direccion, telefono, email]
    ),
  { singleResult: true }
);

const deleteEmpresa = fetchResultPg(
  ({ id }, request) =>
    request.query(`DELETE FROM empresas WHERE id = $1 RETURNING *`, [id]),
  { singleResult: true }
);


const updateEmpresa = fetchResultPg(
  ({ id, nombre, nit, direccion, telefono, email }, request) =>
    request.query(
      `
        UPDATE empresas
        SET nombre = $2, nit = $3, direccion = $4, telefono = $5, email = $6
        WHERE id = $1
        RETURNING *
        `,
      [id, nombre, nit, direccion, telefono, email]
    ),
  { singleResult: true }
);

module.exports = {
  createEmpresa,
  getEmpresas,
  deleteEmpresa,
  updateEmpresa,
};
