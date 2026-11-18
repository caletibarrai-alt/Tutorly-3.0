const crypto = require('node:crypto')
const Usuario = require('../models/usuario')
const Sesion = require('../models/sesion')
const { perfil, verificar, crear, fallo } = require('../services/cuentas')
const { huella } = require('../middleware/autorizacion')
const ok = (res, data, status = 200) =>
  res.status(status).json({ success: true, data })
function ficha(u) {
  return {
    id: u.id,
    correo: u.correo,
    rol: u.rol,
    perfil: u.perfil,
    activo: u.activo,
  }
}
exports.login = async (req, res) => {
  const { correo, clave } = req.body
  if (
    typeof correo !== 'string' ||
    typeof clave !== 'string' ||
    clave.length > 150
  )
    throw fallo(400, 'Completa correo y contraseña')
  const u = await Usuario.findOne({
    correo: correo.trim().toLowerCase(),
    activo: true,
  }).select('+clave')
  if (
    !u ||
    !(await verificar(clave, u.clave)) ||
    (await perfil(u))?.estado !== 'Activo'
  )
    throw fallo(401, 'Revisa tus credenciales o el estado de tu cuenta')
  const token = crypto.randomBytes(32).toString('hex'),
    maxAge = 8 * 3600000
  await Sesion.create({
    usuario: u._id,
    version: u.versionSesion,
    huella: huella(token),
    vence: new Date(Date.now() + maxAge),
  })
  res.cookie('tutorly', token, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge,
    path: '/',
  })
  ok(res, ficha(u))
}
exports.yo = (req, res) => ok(res, { ...ficha(req.cuenta), datos: req.perfil })
exports.salir = async (req, res) => {
  await Sesion.deleteOne({ _id: req.sesion._id })
  res.clearCookie('tutorly')
  ok(res, true)
}
exports.listar = async (req, res) =>
  ok(res, (await Usuario.find().sort({ correo: 1 })).map(ficha))
exports.crear = async (req, res) => {
  const { correo, rol, perfil, clave } = req.body
  if (!['ASESOR', 'ESTUDIANTE'].includes(rol))
    throw fallo(400, 'Selecciona un rol académico')
  if (perfil !== 'nuevo')
    return ok(res, ficha(await crear(correo, rol, perfil, clave)), 201)
  if (
    typeof correo !== 'string' ||
    !/^\S+@\S+\.\S+$/.test(correo) ||
    typeof clave !== 'string' ||
    clave.length < 12 ||
    clave.length > 150
  )
    throw fallo(400, 'Revisa correo y contraseña')
  if (await Usuario.exists({ correo: correo.toLowerCase().trim() }))
    throw fallo(409, 'Este correo ya tiene cuenta')
  const docente = rol === 'ASESOR',
    Modelo = require(docente ? '../models/tutor' : '../models/estudiante')
  const codigo = (docente ? 'P-' : 'E-') + crypto.randomUUID()
  const { nombre, carrera, semestre, telefono, materias } = req.body
  if (
    docente &&
    (!Array.isArray(materias) ||
      !materias.length ||
      (await require('../models/materia').countDocuments({
        materia_id: { $in: materias },
        estado: 'Activa',
      })) !== materias.length)
  )
    throw fallo(400, 'Selecciona materias activas')
  const persona = await Modelo.create({
    [docente ? 'tutor_id' : 'estudiante_id']: codigo,
    email: correo,
    nombre,
    carrera,
    semestre,
    telefono,
    materias,
  })
  let cuenta
  try {
    cuenta = await crear(correo, rol, codigo, clave)
  } catch (error) {
    await Modelo.deleteOne({ _id: persona._id })
    throw error
  }
  ok(res, ficha(cuenta), 201)
}
exports.estado = async (req, res) => {
  if (typeof req.body.activo !== 'boolean')
    throw fallo(400, 'Se requiere un estado válido')
  const u = await Usuario.findOneAndUpdate(
    { _id: req.params.id, rol: { $ne: 'ADMINISTRADOR' } },
    { $set: { activo: req.body.activo }, $inc: { versionSesion: 1 } },
    { new: true },
  )
  if (!u) throw fallo(404, 'Cuenta académica inexistente')
  ok(res, ficha(u))
}

exports.promover = async (req, res) => {
  const cuenta = await Usuario.findOneAndUpdate(
    {
      _id: req.params.id,
      activo: true,
      rol: { $in: ['ESTUDIANTE', 'ASESOR'] },
    },
    { $set: { rol: 'ADMINISTRADOR' }, $inc: { versionSesion: 1 } },
    { new: true },
  )
  if (!cuenta) throw fallo(409, 'Selecciona una cuenta académica activa')
  ok(res, ficha(cuenta))
}
