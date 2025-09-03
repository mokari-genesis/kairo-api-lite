"use strict";
const {
  getProducts,
  createProduct,
  deleteProducts,
  updateProduct,
} = require("./storage");
const { response, getBody } = require(`${process.env['FILE_ENVIRONMENT']}common/utils`);

module.exports.create = async (event) => {
  try {
    const body = getBody(event);
    const { empresa_id, codigo, serie, descripcion, categoria, estado, stock,precio } =
      body;

    if (
      !empresa_id ||
      !codigo ||
      !serie ||
      !descripcion ||
      !categoria ||
      !estado ||
      !stock
    ) {
      throw new Error("Missing required fields");
    }

    const product = await createProduct({
      empresa_id,
      codigo,
      serie,
      descripcion,
      categoria,
      estado,
      stock,
      precio
    });
    return response(200, product, "Done");
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
        product_id,
        empresa_id,
        codigo,
        serie,
        descripcion,
        categoria,
        estado,
        stock,
      },
    } = event;

    const products = await getProducts({
      empresa_id,
      product_id,
      codigo,
      serie,
      descripcion,
      categoria,
      estado,
      stock,
    });
    return response(200, products, "Done");
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
      product_id,
      empresa_id,
      codigo,
      serie,
      descripcion,
      categoria,
      estado,
      stock,
    } = body;

    if (
      !product_id ||
      !empresa_id //||
      // !codigo ||
      // !serie ||
      // !descripcion ||
      // !categoria ||
      // !estado ||
      // !stock
    ) {
      throw new Error("Missing required fields");
    }

    const product = await updateProduct({
      product_id,
      empresa_id,
      codigo,
      serie,
      descripcion,
      categoria,
      estado,
      stock,
    });

    if (product && product.length === 0) {
      throw new Error("Product not found");
    }

    return response(200, product, "Done");
  } catch (error) {
    const message = error.message || "Error";
    console.log("error", error);
    return response(400, null, message);
  }
};

module.exports.delete = async (event) => {
  try {
    const body = getBody(event);
    const { product_ids } = body;

    if (!product_ids) {
      throw new Error("Missing required fields");
    }

    const products = await deleteProducts({ product_ids });
    return response(200, products, "Done");
  } catch (error) {
    const message = error.message || "Error";
    console.log("error", error);
    return response(400, null, message);
  }
};