const Solicitud = require('../models/solicitud')
const Estudiante = require('../models/estudiante')
const Materia = require('../models/materia')
const Tutor = require('../models/tutor')
const { sendError } = require('../middleware/validation')

async function validarReferencias(estudianteId, materiaId, tutorId) {
  const [estudiante, materia, tutor] = await Promise.all([
    Estudiante.findOne({ estudiante_id: estudianteId }),
    Materia.findOne({ materia_id: materiaId }),
    Tutor.findOne({ tutor_id: tutorId })
  ])

  if (!estudiante) throw Object.assign(new Error(`El estudiante ${estudianteId} no existe`), { status: 404 })
  if (!materia) throw Object.assign(new Error(`La materia ${materiaId} no existe`), { status: 404 })
  if (!tutor) throw Object.assign(new Error(`El tutor ${tutorId} no existe`), { status: 404 })

  if (!tutor.materias.includes(materiaId)) {
    throw Object.assign(new Error(`El tutor ${tutorId} no dicta la materia ${materiaId}`), { status: 400 })
  }
}

const controller = {
  obtenerSolicitudes: async (req, res) => {
    try {
      const solicitudes = await Solicitud.find().sort({ fecha_solicitud: -1 })
      return res.status(200).json({ success: true, data: solicitudes })
    } catch (error) {
      return sendError(res, 500, 'No se pudieron obtener las solicitudes')
    }
  },

  obtenerSolicitud: async (req, res) => {
    try {
      const solicitud = await Solicitud.findOne({ solicitud_id: req.params.id })
      if (!solicitud) return sendError(res, 404, `La solicitud ${req.params.id} no existe`)
      return res.status(200).json({ success: true, data: solicitud })
    } catch (error) {
      return sendError(res, 500, 'No se pudo obtener la solicitud')
    }
  },

  crearSolicitud: async (req, res) => {
    try {
      await validarReferencias(req.body.estudiante_id, req.body.materia_id, req.body.tutor_id)
      const solicitud = await Solicitud.create(req.body)
      return res.status(201).json({ success: true, mensaje: 'Solicitud creada correctamente', data: await Solicitud.findById(solicitud._id) })
    } catch (error) {
      if (error.status) return sendError(res, error.status, error.message)
      if (error.code === 11000) return sendError(res, 409, 'La solicitud ya existe')
      if (error.name === 'ValidationError') return sendError(res, 400, error.message)
      return sendError(res, 500, 'No se pudo crear la solicitud')
    }
  },

  actualizarSolicitud: async (req, res) => {
    try {
      const solicitud = await Solicitud.findOne({ solicitud_id: req.params.id })
      if (!solicitud) return sendError(res, 404, `La solicitud ${req.params.id} no existe`)

      const nuevaSolicitud = { ...solicitud.toObject(), ...req.body }
      if (req.body.estudiante_id || req.body.materia_id || req.body.tutor_id) {
        await validarReferencias(
          nuevaSolicitud.estudiante_id,
          nuevaSolicitud.materia_id,
          nuevaSolicitud.tutor_id
        )
      }

      const solicitudActualizada = await Solicitud.findOneAndUpdate(
        { solicitud_id: req.params.id },
        nuevaSolicitud,
        { new: true, runValidators: true }
      )
      return res.status(200).json({ success: true, mensaje: 'Solicitud actualizada correctamente', data: solicitudActualizada })
    } catch (error) {
      if (error.status) return sendError(res, error.status, error.message)
      if (error.code === 11000) return sendError(res, 409, 'La solicitud ya existe')
      if (error.name === 'ValidationError') return sendError(res, 400, error.message)
      return sendError(res, 500, 'No se pudo actualizar la solicitud')
    }
  },

  eliminarSolicitud: async (req, res) => {
    try {
      const solicitud = await Solicitud.findOneAndDelete({ solicitud_id: req.params.id })
      if (!solicitud) return sendError(res, 404, `La solicitud ${req.params.id} no existe`)
      return res.status(200).json({ success: true, mensaje: 'Solicitud eliminada correctamente', data: solicitud })
    } catch (error) {
      return sendError(res, 500, 'No se pudo eliminar la solicitud')
    }
  }
}

module.exports = controller
