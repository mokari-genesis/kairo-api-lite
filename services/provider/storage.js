const { fetchResultPg } = require(`${process.env['FILE_ENVIRONMENT']}common/db`)

const createProvider = fetchResultPg(
  ({ empresa_id, name, nit, email, phone, address, type }, request) =>
    request.query(
      `
      INSERT INTO proveedores (
        empresa_id, nombre, nit, email, telefono, direccion, tipo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [empresa_id, name, nit, email, phone, address, type]
    ),
  { singleResult: true }
);


const getProviders = fetchResultPg(
  ({ name, nit, email, phone, address, empresa_id, type }, request) =>
    request.query(
      `
      SELECT * FROM proveedores 
      WHERE ($6::INT IS NULL OR empresa_id = $6)
      AND ($1::TEXT IS NULL OR nombre ILIKE '%' || $1 || '%')
      AND ($2::TEXT IS NULL OR nit ILIKE '%' || $2 || '%')
      AND ($3::TEXT IS NULL OR email ILIKE '%' || $3 || '%')
      AND ($4::TEXT IS NULL OR telefono ILIKE '%' || $4 || '%')
      AND ($5::TEXT IS NULL OR direccion ILIKE '%' || $5 || '%')
      AND ($7::TEXT IS NULL OR tipo = $7)
      `,
      [name, nit, email, phone, address, empresa_id, type]
    ),
  { singleResult: false }
);

const updateProvider = fetchResultPg(
  ({ id, name, nit, email, phone, address, type }, request) =>
    request.query(
      `
      UPDATE proveedores
      SET nombre = $2,
          nit = $3,
          email = $4,
          telefono = $5,
          direccion = $6,
          tipo = $7
      WHERE id = $1
      RETURNING *
      `,
      [id, name, nit, email, phone, address, type]
    ),
  { singleResult: true }
);

const deleteProvider = fetchResultPg(
  ({ id }, request) =>
    request.query(
      `
      DELETE FROM proveedores
      WHERE id = $1
      RETURNING *
      `,
      [id]
    ),
  { singleResult: true }
);



module.exports = {
  createProvider,
  getProviders,
  updateProvider,
  deleteProvider
};
