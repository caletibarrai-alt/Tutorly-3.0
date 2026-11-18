const Seguimiento = require('../models/seguimiento')
const Tutoria = require('../models/tutoria')
const { sendError } = require('../middleware/validation')

async function validarSeguimiento({ tutoria_id, estudiante_id, materia_id }) {
  const tutoria = await Tutoria.findOne({ tutoria_id })
  if (!tutoria) throw Object.assign(new Error(`La tutoría ${tutoria_id} no existe`), { status: 404 })
  if (tutoria.estudiante_id !== estudiante_id) throw Object.assign(new Error('El estudiante no corresponde a la tutoría'), { status: 400 })
  if (tutoria.materia_id !== materia_id) throw Object.assign(new Error('La materia no corresponde a la tutoría'), { status: 400 })
}

const controller = {
  obtenerSeguimientos: async (req, res) => {
    try {
      const seguimientos = await Seguimiento.find().sort({ fecha: -1 })
      return res.status(200).json({ success: true, data: seguimientos })
    } catch (error) {
      return sendError(res, 500, 'No se pudieron obtener los seguimientos')
    }
  },

  obtenerSeguimiento: async (req, res) => {
    try {
      const seguimiento = await Seguimiento.findOne({ seguimiento_id: req.params.id })
      if (!seguimiento) return sendError(res, 404, `El seguimiento ${req.params.id} no existe`)
      return res.status(200).json({ success: true, data: seguimiento })
    } catch (error) {
      return sendError(res, 500, 'No se pudo obtener el seguimiento')
    }
  },

  crearSeguimiento: async (req, res) => {
    try {
      await validarSeguimiento(req.body)
      const seguimiento = await Seguimiento.create(req.body)
      return res.status(201).json({ success: true, mensaje: 'Seguimiento creado correctamente', data: seguimiento })
    } catch (error) {
      if (error.status) return sendError(res, error.status, error.message)
      if (error.name === 'ValidationError') return sendError(res, 400, error.message)
      return sendError(res, 500, 'No se pudo crear el seguimiento')
    }
  },

  actualizarSeguimiento: async (req, res) => {
    try {
      const seguimiento = await Seguimiento.findOne({ seguimiento_id: req.params.id })
      if (!seguimiento) return sendError(res, 404, `El seguimiento ${req.params.id} no existe`)

      const datosActualizados = { ...seguimiento.toObject(), ...req.body }
      await validarSeguimiento(datosActualizados)
      const seguimientoActualizado = await Seguimiento.findOneAndUpdate({ seguimiento_id: req.params.id }, datosActualizados, { new: true, runValidators: true })
      return res.status(200).json({ success: true, mensaje: 'Seguimiento actualizado correctamente', data: seguimientoActualizado })
    } catch (error) {
      if (error.status) return sendError(res, error.status, error.message)
      if (error.name === 'ValidationError') return sendError(res, 400, error.message)
      return sendError(res, 500, 'No se pudo actualizar el seguimiento')
    }
  },

  eliminarSeguimiento: async (req, res) => {
    try {
      const seguimiento = await Seguimiento.findOneAndDelete({ seguimiento_id: req.params.id })
      if (!seguimiento) return sendError(res, 404, `El seguimiento ${req.params.id} no existe`)
      return res.status(200).json({ success: true, mensaje: 'Seguimiento eliminado correctamente', data: seguimiento })
    } catch (error) {
      return sendError(res, 500, 'No se pudo eliminar el seguimiento')
    }
  }
}

module.exports = controller
