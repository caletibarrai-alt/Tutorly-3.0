const Tutor = require('../models/tutor')
const Materia = require('../models/materia')
const { sendError } = require('../middleware/validation')

const controller = {
  obtenerTutores: async (req, res) => {
    try {
      const query = {}
      if (req.query.estado) query.estado = req.query.estado
      if (req.query.materia) query.materias = req.query.materia
      const tutores = await Tutor.find(query).sort({ fecha_registro: -1 })
      return res.status(200).json({ success: true, data: tutores })
    } catch (error) {
      return sendError(res, 500, 'No se pudieron obtener los tutores')
    }
  },

  obtenerTutor: async (req, res) => {
    try {
      const tutor = await Tutor.findOne({ tutor_id: req.params.id })
      if (!tutor) return sendError(res, 404, `El tutor ${req.params.id} no existe`)
      return res.status(200).json({ success: true, data: tutor })
    } catch (error) {
      return sendError(res, 500, 'No se pudo obtener el tutor')
    }
  },

  crearTutor: async (req, res) => {
    try {
      const tutor = await Tutor.create(req.body)
      return res.status(201).json({ success: true, mensaje: 'Tutor creado correctamente', data: tutor })
    } catch (error) {
      if (error.code === 11000) return sendError(res, 409, 'El email o el ID del tutor ya está registrado')
      if (error.name === 'ValidationError') return sendError(res, 400, error.message)
      return sendError(res, 500, 'No se pudo crear el tutor')
    }
  },

  actualizarTutor: async (req, res) => {
    try {
      const tutor = await Tutor.findOneAndUpdate({ tutor_id: req.params.id }, req.body, { new: true, runValidators: true })
      if (!tutor) return sendError(res, 404, `El tutor ${req.params.id} no existe`)
      return res.status(200).json({ success: true, mensaje: 'Tutor actualizado correctamente', data: tutor })
    } catch (error) {
      if (error.code === 11000) return sendError(res, 409, 'El email o el ID del tutor ya está registrado')
      if (error.name === 'ValidationError') return sendError(res, 400, error.message)
      return sendError(res, 500, 'No se pudo actualizar el tutor')
    }
  },

  eliminarTutor: async (req, res) => {
    try {
      const tutor = await Tutor.findOneAndDelete({ tutor_id: req.params.id })
      if (!tutor) return sendError(res, 404, `El tutor ${req.params.id} no existe`)
      return res.status(200).json({ success: true, mensaje: 'Tutor eliminado correctamente', data: tutor })
    } catch (error) {
      return sendError(res, 500, 'No se pudo eliminar el tutor')
    }
  },

  buscarTutoresPorMateria: async (req, res) => {
    const materiaId = req.query.materia
    if (!materiaId) return sendError(res, 400, 'El parámetro materia es obligatorio')

    try {
      const materia = await Materia.findOne({ materia_id: materiaId, estado: 'Activa' })
      if (!materia) return sendError(res, 404, `La materia ${materiaId} no existe o está inactiva`)

      const tutores = await Tutor.find({ materias: materiaId, estado: 'Activo' })
      return res.status(200).json({ success: true, data: tutores })
    } catch (error) {
      return sendError(res, 500, 'No se pudo buscar los tutores')
    }
  }
}

module.exports = controller
