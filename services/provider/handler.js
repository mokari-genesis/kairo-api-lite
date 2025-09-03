'use strict'
const {
  getProviders,
  createProvider,
  deleteProvider,
  updateProvider,
} = require('./storage')
const {
  response,
  getBody,
} = require(`${process.env['FILE_ENVIRONMENT']}common/utils`)

module.exports.create = async event => {
  try {
    const body = getBody(event)
    const { empresa_id, nombre, tipo, nit, email, telefono, direccion } = body

    if (
      !empresa_id ||
      !nombre ||
      !tipo ||
      !nit ||
      !direccion ||
      !telefono ||
      !email
    ) {
      throw new Error('Missing required fields')
    }

    const provider = await createProvider({
      empresa_id,
      nombre,
      tipo,
      nit,
      email,
      telefono,
      direccion,
    })
    return response(200, provider, 'Done')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}

module.exports.read = async event => {
  try {
    const queryStringParameters = event.queryStringParameters || {}
    const { nombre, nit, direccion, telefono, email, tipo, empresa_id, limit } =
      queryStringParameters

    const providers = await getProviders({
      nombre,
      nit,
      direccion,
      telefono,
      email,
      tipo,
      empresa_id,
      limit,
    })
    return response(200, providers, 'Done')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}

module.exports.update = async event => {
  try {
    const body = getBody(event)
    const { id, nombre, tipo, nit, direccion, telefono, email } = body

    if (!id || !nombre || !tipo || !nit || !direccion || !telefono || !email) {
      throw new Error('Missing required fields')
    }

    const provider = await updateProvider({
      id,
      nombre,
      tipo,
      nit,
      direccion,
      telefono,
      email,
    })

    if (!provider) {
      throw new Error('Provider not found')
    }

    return response(200, provider, 'Done')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}

module.exports.delete = async event => {
  try {
    const body = getBody(event)
    const { id } = body

    if (!id) {
      throw new Error('Missing required fields')
    }

    const providers = await deleteProvider({ id })
    return response(200, providers, 'Done')
  } catch (error) {
    const message = error.message || 'Error'
    console.log('error', error)
    return response(400, null, message)
  }
}
