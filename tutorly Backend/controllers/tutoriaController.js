const Tutoria = require('../models/tutoria')
const Solicitud = require('../models/solicitud')
const Estudiante = require('../models/estudiante')
const Tutor = require('../models/tutor')
const Materia = require('../models/materia')
const { sendError } = require('../middleware/validation')

async function validarTutoria(datos, anterior) {
  const {
    estudiante_id,
    tutor_id,
    materia_id,
    solicitud_id,
    fecha,
    hora_inicio,
    hora_fin,
  } = datos
  const fail = (message, status = 400) => {
    throw Object.assign(new Error(message), { status })
  }
  const dia = new Date(fecha)
  if (!fecha || !Number.isFinite(dia.getTime()))
    fail('Selecciona una fecha válida')
  const hora = /^([01]\d|2[0-3]):[0-5]\d$/
  if (
    !hora.test(hora_inicio) ||
    !hora.test(hora_fin) ||
    hora_fin <= hora_inicio
  )
    fail('Revisa las horas de inicio y fin (HH:mm)')

  const [estudiante, tutor, materia, solicitud] = await Promise.all([
    Estudiante.findOne({ estudiante_id }),
    Tutor.findOne({ tutor_id }),
    Materia.findOne({ materia_id }),
    solicitud_id ? Solicitud.findOne({ solicitud_id }) : null,
  ])

  if (!estudiante)
    throw Object.assign(new Error(`El estudiante ${estudiante_id} no existe`), {
      status: 404,
    })
  if (!tutor)
    throw Object.assign(new Error(`El tutor ${tutor_id} no existe`), {
      status: 404,
    })
  if (!materia)
    throw Object.assign(new Error(`La materia ${materia_id} no existe`), {
      status: 404,
    })
  if (
    solicitud &&
    (solicitud.estudiante_id !== estudiante_id ||
      solicitud.tutor_id !== tutor_id ||
      solicitud.materia_id !== materia_id ||
      ['Cancelada', 'Rechazada'].includes(solicitud.estado))
  )
    fail('La solicitud no corresponde a esta reserva')
  const activa = ['Programada', 'EnCurso'].includes(
    datos.estado || 'Programada',
  )
  if (activa) {
    const cambioHorario =
      !anterior ||
      anterior.hora_inicio !== hora_inicio ||
      +anterior.fecha !== +dia
    const instante = new Date(
      dia.toISOString().slice(0, 10) + 'T' + hora_inicio + ':00-05:00',
    )
    if (cambioHorario && instante.getTime() < Date.now())
      fail('Elige una fecha y hora futuras (hora de Colombia)')
    if (
      estudiante.estado !== 'Activo' ||
      tutor.estado !== 'Activo' ||
      materia.estado !== 'Activa'
    )
      fail('La reserva requiere un estudiante, tutor y materia activos')
    if (!tutor.materias.includes(materia_id))
      fail('El tutor no orienta esta materia')
    const inicio = new Date(dia.toISOString().slice(0, 10))
    const fin = new Date(inicio.getTime() + 86400000)
    const cruce = await Tutoria.exists({
      tutoria_id: { $ne: anterior?.tutoria_id || datos.tutoria_id },
      estado: { $in: ['Programada', 'EnCurso'] },
      fecha: { $gte: inicio, $lt: fin },
      hora_inicio: { $lt: hora_fin },
      hora_fin: { $gt: hora_inicio },
      $or: [{ tutor_id }, { estudiante_id }, {'participantes.estudiante':estudiante_id }],
    })
    if (cruce)
      fail('El tutor o el estudiante ya tiene una sesión en ese horario', 409)
    await require('../services/disponibilidad')(datos)
  }
  if (solicitud_id && !solicitud)
    throw Object.assign(new Error(`La solicitud ${solicitud_id} no existe`), {
      status: 404,
    })
}

const controller = {
  obtenerTutorias: async (req, res) => {
    try {
      const filter = {}
      if (req.query.estudiante_id)
        filter.estudiante_id = req.query.estudiante_id
      if (req.query.tutor_id) filter.tutor_id = req.query.tutor_id
      if (req.query.materia_id) filter.materia_id = req.query.materia_id
      if (req.query.estado) filter.estado = req.query.estado
      const tutorias = await Tutoria.find(filter).sort({ fecha: 1 })
      return res.status(200).json({ success: true, data: tutorias })
    } catch (error) {
      return sendError(res, 500, 'No se pudieron obtener las tutorías')
    }
  },

  obtenerTutoria: async (req, res) => {
    try {
      const tutoria = await Tutoria.findOne({ tutoria_id: req.params.id })
      if (!tutoria)
        return sendError(res, 404, `La tutoría ${req.params.id} no existe`)
      return res.status(200).json({ success: true, data: tutoria })
    } catch (error) {
      return sendError(res, 500, 'No se pudo obtener la tutoría')
    }
  },

  crearTutoria: async (req, res) => {
    try {
      await validarTutoria(req.body)
      const tutoria = await Tutoria.create(req.body)
      return res
        .status(201)
        .json({
          success: true,
          mensaje: 'Tutoría creada correctamente',
          data: tutoria,
        })
    } catch (error) {
      if (error.status) return sendError(res, error.status, error.message)
      if (error.code === 11000)
        return sendError(res, 409, 'La tutoría ya existe')
      if (error.name === 'ValidationError')
        return sendError(res, 400, error.message)
      return sendError(res, 500, 'No se pudo crear la tutoría')
    }
  },

  actualizarTutoria: async (req, res) => {
    try {
      const tutoria = await Tutoria.findOne({ tutoria_id: req.params.id })
      if (!tutoria)
        return sendError(res, 404, `La tutoría ${req.params.id} no existe`)

      const datosActualizados = { ...tutoria.toObject(), ...req.body }
      if (['Finalizada', 'Cancelada', 'NoAsistio'].includes(tutoria.estado)) {
        const campos = [
          'estado',
          'estudiante_id',
          'materia_id',
          'tutor_id',
          'hora_inicio',
          'hora_fin',
          'modalidad',
          'solicitud_id',
        ]
        if (
          campos.some(
            (k) => (tutoria[k] || '') !== (datosActualizados[k] || ''),
          ) ||
          +new Date(datosActualizados.fecha) !== +tutoria.fecha
        )
          return sendError(
            res,
            409,
            'La sesión cerrada solo admite correcciones de contenido',
          )
      }
      await validarTutoria(datosActualizados, tutoria)

      const tutoriaActualizada = await Tutoria.findOneAndUpdate(
        { tutoria_id: req.params.id },
        datosActualizados,
        { new: true, runValidators: true },
      )
      return res
        .status(200)
        .json({
          success: true,
          mensaje: 'Tutoría actualizada correctamente',
          data: tutoriaActualizada,
        })
    } catch (error) {
      if (error.status) return sendError(res, error.status, error.message)
      if (error.code === 11000)
        return sendError(res, 409, 'La tutoría ya existe')
      if (error.name === 'ValidationError')
        return sendError(res, 400, error.message)
      return sendError(res, 500, 'No se pudo actualizar la tutoría')
    }
  },

  eliminarTutoria: async (req, res) => {
    try {
      const tutoria = await Tutoria.findOneAndDelete({
        tutoria_id: req.params.id,
      })
      if (!tutoria)
        return sendError(res, 404, `La tutoría ${req.params.id} no existe`)
      return res
        .status(200)
        .json({
          success: true,
          mensaje: 'Tutoría eliminada correctamente',
          data: tutoria,
        })
    } catch (error) {
      return sendError(res, 500, 'No se pudo eliminar la tutoría')
    }
  },

  tutoriasPorEstudiante: async (req, res) => {
    try {
      const tutorias = await Tutoria.find({
        estudiante_id: req.params.id,
      }).sort({ fecha: -1 })
      return res.status(200).json({ success: true, data: tutorias })
    } catch (error) {
      return sendError(
        res,
        500,
        'No se pudieron obtener las tutorías del estudiante',
      )
    }
  },

  tutoriasPorTutor: async (req, res) => {
    try {
      const tutorias = await Tutoria.find({ tutor_id: req.params.id }).sort({
        fecha: -1,
      })
      return res.status(200).json({ success: true, data: tutorias })
    } catch (error) {
      return sendError(
        res,
        500,
        'No se pudieron obtener las tutorías del tutor',
      )
    }
  },

  tutoriasPorMateria: async (req, res) => {
    try {
      const tutorias = await Tutoria.find({ materia_id: req.params.id }).sort({
        fecha: -1,
      })
      return res.status(200).json({ success: true, data: tutorias })
    } catch (error) {
      return sendError(
        res,
        500,
        'No se pudieron obtener las tutorías de la materia',
      )
    }
  },
}

module.exports = controller
