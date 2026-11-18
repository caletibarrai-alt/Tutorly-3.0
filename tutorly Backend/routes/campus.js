const r = require('express').Router()
const { ruta, permitir } = require('../middleware/autorizacion')
const { fallo } = require('../services/cuentas')
const Tutoria = require('../models/tutoria'),
  Solicitud = require('../models/solicitud'),
  Tutor = require('../models/tutor'),
  Materia = require('../models/materia')
const Asistencia = require('../models/asistencia'),
  Valoracion = require('../models/valoracion')
const sc = require('../controllers/solicitudController')
r.get(
  '/',
  ruta(async (req, res) => {
    const { rol, perfil } = req.cuenta
    const filtro =
      rol === 'ASESOR' ? { tutor_id: perfil } : { estudiante_id: perfil }
    const [agenda, solicitudes, asistencias, resenas, materias, profesores] =
      await Promise.all([
        Tutoria.find(filtro).sort({ fecha: -1 }),
        Solicitud.find(filtro),
        Asistencia.find(filtro),
        Valoracion.find(filtro),
        Materia.find({ estado: 'Activa' }).select('nombre materia_id -_id'),
        Tutor.find({ estado: 'Activo' }).select(
          'nombre materias tutor_id -_id',
        ),
      ])
    res.json({
      success: true,
      data: { agenda, solicitudes, asistencias, resenas, materias, profesores },
    })
  }),
)
r.post(
  '/solicitudes',
  permitir('ESTUDIANTE'),
  ruta(async (req, res) => {
    const { materia_id, tutor_id, motivo } = req.body
    if (
      ![materia_id, tutor_id, motivo].every(
        (x) => typeof x === 'string' && x.trim(),
      ) ||
      motivo.length > 1500
    )
      throw fallo(400, 'Selecciona materia, profesor y motivo')
    if (
      !(await Materia.exists({ materia_id, estado: 'Activa' })) ||
      !(await Tutor.exists({
        tutor_id,
        estado: 'Activo',
        materias: materia_id,
      }))
    )
      throw fallo(400, 'La materia o el asesor ya no están disponibles')
    const archivo = require('../services/archivo').leer(req.body.archivo)
    req.body = {
      archivo,
      solicitud_id: 'S-' + require('crypto').randomUUID(),
      estudiante_id: req.cuenta.perfil,
      tutor_id,
      materia_id,
      motivo,
      prioridad: 'Media',
      estado: 'Pendiente',
    }
    return sc.crearSolicitud(req, res)
  }),
)
r.get(
  '/solicitudes/:id/archivo',
  ruta(async (req, res) => {
    const campo = req.cuenta.rol === 'ASESOR' ? 'tutor_id' : 'estudiante_id'
    const doc = await Solicitud.findOne({
      solicitud_id: req.params.id,
      [campo]: req.cuenta.perfil,
    }).select('+archivo.bytes')
    require('../services/archivo').enviar(res, doc?.archivo)
  }),
)
r.put(
  '/solicitudes/:id',
  ruta(async (req, res) => {
    const estudiante = req.cuenta.rol === 'ESTUDIANTE',
      estado = req.body.estado
    if (!(estudiante ? ['Cancelada'] : ['Rechazada']).includes(estado))
      throw fallo(403, 'Acción fuera de tu rol')
    const doc = await Solicitud.findOneAndUpdate(
      {
        solicitud_id: req.params.id,
        [estudiante ? 'estudiante_id' : 'tutor_id']: req.cuenta.perfil,
        estado: 'Pendiente',
      },
      { $set: { estado } },
      { new: true },
    )
    if (!doc)
      throw fallo(
        404,
        'No hay una solicitud pendiente asignada a tu cuenta con ese código',
      )
    res.json({ success: true, data: doc })
  }),
)
r.post(
  '/solicitudes/:id/mensajes',
  ruta(async (req, res) => {
    const campo = req.cuenta.rol === 'ASESOR' ? 'tutor_id' : 'estudiante_id'
    const texto = req.body.texto
    if (typeof texto !== 'string' || !texto.trim() || texto.length > 1000)
      throw fallo(400, 'Escribe un mensaje de hasta 1000 caracteres')
    const cambio = await Solicitud.updateOne(
      {
        solicitud_id: req.params.id,
        [campo]: req.cuenta.perfil,
        estado: { $in: ['Pendiente', 'Aprobada'] },
        'mensajes.49': { $exists: false },
      },
      {
        $push: {
          mensajes: {
            rol: req.cuenta.rol,
            texto: texto.trim(),
            fecha: new Date(),
          },
        },
      },
    )
    if (!cambio.modifiedCount)
      throw fallo(409, 'Conversación cerrada o no disponible')
    res.status(201).json({ success: true, data: true })
  }),
)
module.exports = r
