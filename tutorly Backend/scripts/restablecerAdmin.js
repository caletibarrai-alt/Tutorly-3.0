
const mongoose = require('mongoose')
const crypto = require('node:crypto')
const { promisify } = require('node:util')

const derivar = promisify(crypto.scrypt)
const Usuario = require('../models/usuario')

require('../config/env').loadEnv()

async function main() {
  await require('../config/database').connectDatabase()

  // Buscar al administrador principal existente
  const admin = await Usuario.findOne({
    rol: 'ADMINISTRADOR',
    perfil: 'principal'
  }).select('+clave')

  if (!admin) {
    console.log('No se encontró el administrador principal.')
    return
  }

  // Generar una nueva contraseña aleatoria
  const nuevaClave = crypto.randomBytes(18).toString('base64url')

  // Utilizar el mismo algoritmo del backend
  const sal = crypto.randomBytes(16).toString('hex')
  const hash = await derivar(nuevaClave, sal, 64)

  // Actualizar únicamente las credenciales de acceso
  admin.clave = sal + '.' + hash.toString('hex')
  admin.versionSesion = (admin.versionSesion || 0) + 1

  await admin.save()

  console.log('\nContraseña restablecida correctamente.')
  console.log('Correo:', admin.correo)
  console.log('Nueva contraseña:', nuevaClave)
  console.log('\nGuarda esta contraseña en un lugar seguro.')
}

main()
  .catch(error => {
    console.error('Error:', error.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
