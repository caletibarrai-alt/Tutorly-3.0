const Estudiante = require('../models/estudiante')
const { sendError } = require('../middleware/validation')

const buildEstudianteQuery = (req) => {
  const filter = {}
  if (req.query.estado) filter.estado = req.query.estado
  if (req.query.carrera) filter.carrera = new RegExp(req.query.carrera, 'i')
  if (req.query.semestre) filter.semestre = Number(req.query.semestre)
  return filter
}

const controller = {
  obtenerEstudiantes: async (req, res) => {
    try {
      const estudiantes = await Estudiante.find(buildEstudianteQuery(req)).sort({ fecha_registro: -1 })
      return res.status(200).json({ success: true, data: estudiantes })
    } catch (error) {
      return sendError(res, 500, 'No se pudieron obtener los estudiantes')
    }
  },

  obtenerEstudiante: async (req, res) => {
    try {
      const estudiante = await Estudiante.findOne({ estudiante_id: req.params.id })
      if (!estudiante) return sendError(res, 404, `El estudiante ${req.params.id} no existe`)
      return res.status(200).json({ success: true, data: estudiante })
    } catch (error) {
      return sendError(res, 500, 'No se pudo obtener el estudiante')
    }
  },

  crearEstudiante: async (req, res) => {
    try {
      const estudiante = await Estudiante.create(req.body)
      return res.status(201).json({
        success: true,
        mensaje: 'Estudiante creado correctamente',
        data: estudiante
      })
    } catch (error) {
      if (error.code === 11000) return sendError(res, 409, 'El email ya está registrado')
      if (error.name === 'ValidationError') return sendError(res, 400, error.message)
      return sendError(res, 500, 'No se pudo crear el estudiante')
    }
  },

  actualizarEstudiante: async (req, res) => {
    try {
      const estudiante = await Estudiante.findOneAndUpdate(
        { estudiante_id: req.params.id },
        req.body,
        { new: true, runValidators: true }
      )
      if (!estudiante) return sendError(res, 404, `El estudiante ${req.params.id} no existe`)
      return res.status(200).json({ success: true, mensaje: 'Estudiante actualizado correctamente', data: estudiante })
    } catch (error) {
      if (error.code === 11000) return sendError(res, 409, 'El email ya está registrado')
      if (error.name === 'ValidationError') return sendError(res, 400, error.message)
      return sendError(res, 500, 'No se pudo actualizar el estudiante')
    }
  },

  eliminarEstudiante: async (req, res) => {
    try {
      const estudiante = await Estudiante.findOneAndDelete({ estudiante_id: req.params.id })
      if (!estudiante) return sendError(res, 404, `El estudiante ${req.params.id} no existe`)
      return res.status(200).json({ success: true, mensaje: 'Estudiante eliminado correctamente', data: estudiante })
    } catch (error) {
      return sendError(res, 500, 'No se pudo eliminar el estudiante')
    }
  }
}

module.exports = controller
