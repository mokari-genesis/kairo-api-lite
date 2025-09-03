"use strict";
const {
  getClients,
  createClient,
  deleteClient,
  updateClient,
} = require("./storage");
const { response, getBody } = require(`${process.env['FILE_ENVIRONMENT']}common/utils`)

module.exports.create = async (event) => {
  try {
    const body = getBody(event);
    const { empresa_id, name, type, nit, email, phone, address } = body;

    if (
      !empresa_id ||
      !name ||
      !type ||
      !nit ||
      !address ||
      !phone ||
      !email
    ) {
      throw new Error("Missing required fields");
    }

    const cliente = await createClient({
      empresa_id,
      name,
      type,
      nit,
      email,
      phone,
      address,
    });
    return response(200, cliente, "Done");
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
        name,
        nit,
        address,
        phone,
        email,
        type,
        empresa_id,
      },
    } = event;

    const clientes = await getClients({
      name,
      nit,
      address,
      phone,
      email,
      type,
      empresa_id,
    });
    return response(200, clientes, "Done");
  } catch (error) {
    const message = error.message || "Error";
    console.log("error", error);
    return response(400, null, message);
  }
};

module.exports.update = async (event) => {
  try {
    const body = getBody(event);
    const { id,name, type, nit, address, phone, email } =
      body;

    if (
      !id ||
      !name ||
      !type ||
      !nit ||
      !address ||
      !phone ||
      !email
    ) {
      throw new Error("Missing required fields");
    }

    const cliente = await updateClient({
      id,
      name,
      type,
      nit,
      address,
      phone,
      email,
    });

    if (!cliente) {
      throw new Error("Cliente not found");
    }

    return response(200, cliente, "Done");
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

    const clientes = await deleteClient({ id });
    return response(200, clientes, "Done");
  } catch (error) {
    const message = error.message || "Error";
    console.log("error", error);
    return response(400, null, message);
  }
};
