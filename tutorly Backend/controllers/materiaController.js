const Materia = require('../models/materia')
const { sendError } = require('../middleware/validation')

const controller = {
  obtenerMaterias: async (req, res) => {
    try {
      const materias = await Materia.find().sort({ nombre: 1 })
      return res.status(200).json({ success: true, data: materias })
    } catch (error) {
      return sendError(res, 500, 'No se pudieron obtener las materias')
    }
  },

  obtenerMateria: async (req, res) => {
    try {
      const materia = await Materia.findOne({ materia_id: req.params.id })
      if (!materia) return sendError(res, 404, `La materia ${req.params.id} no existe`)
      return res.status(200).json({ success: true, data: materia })
    } catch (error) {
      return sendError(res, 500, 'No se pudo obtener la materia')
    }
  },

  crearMateria: async (req, res) => {
    try {
      const materia = await Materia.create(req.body)
      return res.status(201).json({ success: true, mensaje: 'Materia creada correctamente', data: materia })
    } catch (error) {
      if (error.code === 11000) return sendError(res, 409, 'La materia ya existe')
      if (error.name === 'ValidationError') return sendError(res, 400, error.message)
      return sendError(res, 500, 'No se pudo crear la materia')
    }
  },

  actualizarMateria: async (req, res) => {
    try {
      const materia = await Materia.findOneAndUpdate({ materia_id: req.params.id }, req.body, { new: true, runValidators: true })
      if (!materia) return sendError(res, 404, `La materia ${req.params.id} no existe`)
      return res.status(200).json({ success: true, mensaje: 'Materia actualizada correctamente', data: materia })
    } catch (error) {
      if (error.code === 11000) return sendError(res, 409, 'La materia ya existe')
      if (error.name === 'ValidationError') return sendError(res, 400, error.message)
      return sendError(res, 500, 'No se pudo actualizar la materia')
    }
  },

  eliminarMateria: async (req, res) => {
    try {
      const materia = await Materia.findOneAndDelete({ materia_id: req.params.id })
      if (!materia) return sendError(res, 404, `La materia ${req.params.id} no existe`)
      return res.status(200).json({ success: true, mensaje: 'Materia eliminada correctamente', data: materia })
    } catch (error) {
      return sendError(res, 500, 'No se pudo eliminar la materia')
    }
  }
}

module.exports = controller
