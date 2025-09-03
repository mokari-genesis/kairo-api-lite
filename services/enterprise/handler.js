"use strict";
const {
  getEmpresas,
  createEmpresa,
  deleteEmpresa,
  updateEmpresa,
} = require("./storage");
const { response, getBody } = require(`${process.env['FILE_ENVIRONMENT']}common/utils`)

module.exports.create = async (event) => {
  try {
    const body = getBody(event);
    const { nombre, nit, direccion, telefono, email } = body;

    if (
      !nombre ||
      !nit ||
      !direccion ||
      !telefono ||
      !email
    ) {
      throw new Error("Missing required fields");
    }

    const empresa = await createEmpresa({
      nombre,
      nit,
      direccion,
      telefono,
      email,
    });
    return response(200, empresa, "Done");
  } catch (error) {
    const message = error.message || "Error";
    console.log("error", error);
    return response(400, null, message);
  }
};

module.exports.read = async (event) => {
  try {
    const {
      queryStringParameters: {
        nombre,
        nit,
        direccion,
        telefono,
        email,
      },
    } = event;

    const empresas = await getEmpresas({
      nombre,
      nit,
      direccion,
      telefono,
      email,
    });
    return response(200, empresas, "Done");
  } catch (error) {
    const message = error.message || "Error";
    console.log("error", error);
    return response(400, null, message);
  }
};

module.exports.update = async (event) => {
  try {
    const body = getBody(event);
    const {
      id,
      nombre,
      nit,
      direccion,
      telefono,
      email,
    } = body;

    if (
      !id ||
      !nombre ||
      !nit ||
      !direccion ||
      !telefono ||
      !email
    ) {
      throw new Error("Missing required fields");
    }

    const empresa = await updateEmpresa({
      id,
      nombre,
      nit,
      direccion,
      telefono,
      email,
    });

    if (!empresa) {
      throw new Error("Empresa not found");
    }

    return response(200, empresa, "Done");
  } catch (error) {
    const message = error.message || "Error";
    console.log("error", error);
    return response(400, null, message);
  }
};

module.exports.delete = async (event) => {
  try {
    const body = getBody(event);
    const { id } = body;

    if (!id) {
      throw new Error("Missing required fields");
    }

    const empresas = await deleteEmpresa({ id });
    return response(200, empresas, "Done");
  } catch (error) {
    const message = error.message || "Error";
    console.log("error", error);
    return response(400, null, message);
  }
};