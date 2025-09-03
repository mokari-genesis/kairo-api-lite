"use strict";
const {
  getProviders,
  createProvider,
  deleteProvider,
  updateProvider,
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

    const provider = await createProvider({
      empresa_id,
      name,
      type,
      nit,
      email,
      phone,
      address,
    });
    return response(200, provider, "Done");
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

    const providers = await getProviders({
      name,
      nit,
      address,
      phone,
      email,
      type,
      empresa_id,
    });
    return response(200, providers, "Done");
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

    const provider = await updateProvider({
      id,
      name,
      type,
      nit,
      address,
      phone,
      email,
    });

    if (!provider) {
      throw new Error("Provider not found");
    }

    return response(200, provider, "Done");
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

    const providers = await deleteProvider({ id });
    return response(200, providers, "Done");
  } catch (error) {
    const message = error.message || "Error";
    console.log("error", error);
    return response(400, null, message);
  }
};
