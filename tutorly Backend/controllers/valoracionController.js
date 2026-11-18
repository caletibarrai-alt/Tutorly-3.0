const Valoracion = require('../models/valoracion')
const Tutoria = require('../models/tutoria')
const { sendError } = require('../middleware/validation')

async function validarValoracion({ tutoria_id, estudiante_id, tutor_id }) {
  const tutoria = await Tutoria.findOne({ tutoria_id })
  if (!tutoria) throw Object.assign(new Error(`La tutoría ${tutoria_id} no existe`), { status: 404 })
  if (tutoria.estudiante_id !== estudiante_id) throw Object.assign(new Error('El estudiante no corresponde a la tutoría'), { status: 400 })
  if (tutoria.tutor_id !== tutor_id) throw Object.assign(new Error('El tutor no corresponde a la tutoría'), { status: 400 })
  if (tutoria.estado !== 'Finalizada') throw Object.assign(new Error('Solo se puede valorar una tutoría finalizada'), { status: 400 })
}

const controller = {
  obtenerValoraciones: async (req, res) => {
    try {
      const valoraciones = await Valoracion.find().sort({ fecha: -1 })
      return res.status(200).json({ success: true, data: valoraciones })
    } catch (error) {
      return sendError(res, 500, 'No se pudieron obtener las valoraciones')
    }
  },

  obtenerValoracion: async (req, res) => {
    try {
      const valoracion = await Valoracion.findOne({ valoracion_id: req.params.id })
      if (!valoracion) return sendError(res, 404, `La valoración ${req.params.id} no existe`)
      return res.status(200).json({ success: true, data: valoracion })
    } catch (error) {
      return sendError(res, 500, 'No se pudo obtener la valoración')
    }
  },

  crearValoracion: async (req, res) => {
    try {
      await validarValoracion(req.body)
      const existente = await Valoracion.findOne({ tutoria_id: req.body.tutoria_id })
      if (existente) return sendError(res, 409, 'Esta tutoría ya tiene una valoración registrada')

      const valoracion = await Valoracion.create(req.body)
      return res.status(201).json({ success: true, mensaje: 'Valoración registrada correctamente', data: valoracion })
    } catch (error) {
      if (error.status) return sendError(res, error.status, error.message)
      if (error.name === 'ValidationError') return sendError(res, 400, error.message)
      return sendError(res, 500, 'No se pudo registrar la valoración')
    }
  },

  actualizarValoracion: async (req, res) => {
    try {
      const valoracion = await Valoracion.findOne({ valoracion_id: req.params.id })
      if (!valoracion) return sendError(res, 404, `La valoración ${req.params.id} no existe`)

      const datosActualizados = { ...valoracion.toObject(), ...req.body }
      await validarValoracion(datosActualizados)
      const valoracionActualizada = await Valoracion.findOneAndUpdate({ valoracion_id: req.params.id }, datosActualizados, { new: true, runValidators: true })
      return res.status(200).json({ success: true, mensaje: 'Valoración actualizada correctamente', data: valoracionActualizada })
    } catch (error) {
      if (error.status) return sendError(res, error.status, error.message)
      if (error.name === 'ValidationError') return sendError(res, 400, error.message)
      return sendError(res, 500, 'No se pudo actualizar la valoración')
    }
  },

  eliminarValoracion: async (req, res) => {
    try {
      const valoracion = await Valoracion.findOneAndDelete({ valoracion_id: req.params.id })
      if (!valoracion) return sendError(res, 404, `La valoración ${req.params.id} no existe`)
      return res.status(200).json({ success: true, mensaje: 'Valoración eliminada correctamente', data: valoracion })
    } catch (error) {
      return sendError(res, 500, 'No se pudo eliminar la valoración')
    }
  }
}

module.exports = controller
