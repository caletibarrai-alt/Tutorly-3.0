const Disponibilidad = require('../models/disponibilidad')
const Tutor = require('../models/tutor')
const { sendError } = require('../middleware/validation')

async function validarDisponibilidad({ tutor_id }) {
  const tutor = await Tutor.findOne({ tutor_id })
  if (!tutor) throw Object.assign(new Error(`El tutor ${tutor_id} no existe`), { status: 404 })
}

const controller = {
  obtenerDisponibilidades: async (req, res) => {
    try {
      const filter = {}
      if (req.query.tutor_id) filter.tutor_id = req.query.tutor_id
      if (req.query.estado) filter.estado = req.query.estado
      const disponibilidades = await Disponibilidad.find(filter).sort({ dia: 1, hora_inicio: 1 })
      return res.status(200).json({ success: true, data: disponibilidades })
    } catch (error) {
      return sendError(res, 500, 'No se pudieron obtener las disponibilidades')
    }
  },

  obtenerDisponibilidad: async (req, res) => {
    try {
      const disponibilidad = await Disponibilidad.findOne({ disponibilidad_id: req.params.id })
      if (!disponibilidad) return sendError(res, 404, `La disponibilidad ${req.params.id} no existe`)
      return res.status(200).json({ success: true, data: disponibilidad })
    } catch (error) {
      return sendError(res, 500, 'No se pudo obtener la disponibilidad')
    }
  },

  crearDisponibilidad: async (req, res) => {
    try {
      await validarDisponibilidad(req.body)
      const disponibilidad = await Disponibilidad.create(req.body)
      return res.status(201).json({ success: true, mensaje: 'Disponibilidad creada correctamente', data: disponibilidad })
    } catch (error) {
      if (error.status) return sendError(res, error.status, error.message)
      if (error.code === 11000) return sendError(res, 409, 'La disponibilidad ya existe')
      if (error.name === 'ValidationError') return sendError(res, 400, error.message)
      return sendError(res, 500, 'No se pudo crear la disponibilidad')
    }
  },

  actualizarDisponibilidad: async (req, res) => {
    try {
      const disponibilidad = await Disponibilidad.findOne({ disponibilidad_id: req.params.id })
      if (!disponibilidad) return sendError(res, 404, `La disponibilidad ${req.params.id} no existe`)

      const datosActualizados = { ...disponibilidad.toObject(), ...req.body }
      await validarDisponibilidad(datosActualizados)
      const disponibilidadActualizada = await Disponibilidad.findOneAndUpdate({ disponibilidad_id: req.params.id }, datosActualizados, { new: true, runValidators: true })
      return res.status(200).json({ success: true, mensaje: 'Disponibilidad actualizada correctamente', data: disponibilidadActualizada })
    } catch (error) {
      if (error.status) return sendError(res, error.status, error.message)
      if (error.code === 11000) return sendError(res, 409, 'La disponibilidad ya existe')
      if (error.name === 'ValidationError') return sendError(res, 400, error.message)
      return sendError(res, 500, 'No se pudo actualizar la disponibilidad')
    }
  },

  eliminarDisponibilidad: async (req, res) => {
    try {
      const disponibilidad = await Disponibilidad.findOneAndDelete({ disponibilidad_id: req.params.id })
      if (!disponibilidad) return sendError(res, 404, `La disponibilidad ${req.params.id} no existe`)
      return res.status(200).json({ success: true, mensaje: 'Disponibilidad eliminada correctamente', data: disponibilidad })
    } catch (error) {
      return sendError(res, 500, 'No se pudo eliminar la disponibilidad')
    }
  }
}

module.exports = controller
