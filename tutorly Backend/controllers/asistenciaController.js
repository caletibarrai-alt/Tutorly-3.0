const Asistencia = require('../models/asistencia')
const Tutoria = require('../models/tutoria')
const { sendError } = require('../middleware/validation')

async function validarAsistencia({ tutoria_id, estudiante_id, tutor_id }) {
  const tutoria = await Tutoria.findOne({ tutoria_id })
  if (!tutoria) throw Object.assign(new Error(`La tutoría ${tutoria_id} no existe`), { status: 404 })
  if (tutoria.estudiante_id !== estudiante_id) throw Object.assign(new Error('El estudiante no corresponde a la tutoría'), { status: 400 })
  if (tutoria.tutor_id !== tutor_id) throw Object.assign(new Error('El tutor no corresponde a la tutoría'), { status: 400 })
}

const controller = {
  obtenerAsistencias: async (req, res) => {
    try {
      const asistencias = await Asistencia.find().sort({ _id: -1 })
      return res.status(200).json({ success: true, data: asistencias })
    } catch (error) {
      return sendError(res, 500, 'No se pudieron obtener las asistencias')
    }
  },

  obtenerAsistencia: async (req, res) => {
    try {
      const asistencia = await Asistencia.findOne({ asistencia_id: req.params.id })
      if (!asistencia) return sendError(res, 404, `La asistencia ${req.params.id} no existe`)
      return res.status(200).json({ success: true, data: asistencia })
    } catch (error) {
      return sendError(res, 500, 'No se pudo obtener la asistencia')
    }
  },

  crearAsistencia: async (req, res) => {
    try {
      await validarAsistencia(req.body)
      const asistencia = await Asistencia.create(req.body)
      return res.status(201).json({ success: true, mensaje: 'Asistencia registrada correctamente', data: asistencia })
    } catch (error) {
      if (error.status) return sendError(res, error.status, error.message)
      if (error.code === 11000) return sendError(res, 409, 'La tutoría ya tiene una asistencia registrada')
      if (error.name === 'ValidationError') return sendError(res, 400, error.message)
      return sendError(res, 500, 'No se pudo registrar la asistencia')
    }
  },

  actualizarAsistencia: async (req, res) => {
    try {
      const asistencia = await Asistencia.findOne({ asistencia_id: req.params.id })
      if (!asistencia) return sendError(res, 404, `La asistencia ${req.params.id} no existe`)

      const datosActualizados = { ...asistencia.toObject(), ...req.body }
      await validarAsistencia(datosActualizados)
      const asistenciaActualizada = await Asistencia.findOneAndUpdate({ asistencia_id: req.params.id }, datosActualizados, { new: true, runValidators: true })
      return res.status(200).json({ success: true, mensaje: 'Asistencia actualizada correctamente', data: asistenciaActualizada })
    } catch (error) {
      if (error.status) return sendError(res, error.status, error.message)
      if (error.name === 'ValidationError') return sendError(res, 400, error.message)
      return sendError(res, 500, 'No se pudo actualizar la asistencia')
    }
  },

  eliminarAsistencia: async (req, res) => {
    try {
      const asistencia = await Asistencia.findOneAndDelete({ asistencia_id: req.params.id })
      if (!asistencia) return sendError(res, 404, `La asistencia ${req.params.id} no existe`)
      return res.status(200).json({ success: true, mensaje: 'Asistencia eliminada correctamente', data: asistencia })
    } catch (error) {
      return sendError(res, 500, 'No se pudo eliminar la asistencia')
    }
  }
}

module.exports = controller
