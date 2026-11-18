const mongoose = require('mongoose')
const Tutor = require('../models/tutor')
const Materia = require('../models/materia')
const Estudiante = require('../models/estudiante')
const Tutoria = require('../models/tutoria')
const Valoracion = require('../models/valoracion')
const Asistencia = require('../models/asistencia')
const { sendError } = require('../middleware/validation')

const controller = {
  tutores: async (req, res) => {
    try {
      const reportes = await Valoracion.aggregate([
        { $lookup: { from: 'tutorias', localField: 'tutoria_id', foreignField: 'tutoria_id', as: 'tutoria' } },
        { $unwind: '$tutoria' },
        { $group: { _id: '$tutor_id', promedio: { $avg: '$puntuacion' }, cantidad: { $sum: 1 } } },
        { $sort: { promedio: -1, cantidad: -1 } },
        { $project: { _id: 0, tutor_id: '$_id', promedio: { $round: ['$promedio', 2] }, cantidad_valoraciones: '$cantidad' } }
      ])
      return res.status(200).json({ success: true, data: reportes })
    } catch (error) {
      return sendError(res, 500, 'No se pudo generar el reporte de tutores')
    }
  },

  materias: async (req, res) => {
    try {
      const reportes = await Tutoria.aggregate([
        { $group: { _id: '$materia_id', cantidad_tutorias: { $sum: 1 } } },
        { $lookup: { from: 'materias', localField: '_id', foreignField: 'materia_id', as: 'materia' } },
        { $unwind: { path: '$materia', preserveNullAndEmptyArrays: true } },
        { $sort: { cantidad_tutorias: -1 } },
        { $project: { _id: 0, materia_id: '$_id', nombre: '$materia.nombre', cantidad_tutorias: 1 } }
      ])
      return res.status(200).json({ success: true, data: reportes })
    } catch (error) {
      return sendError(res, 500, 'No se pudo generar el reporte de materias')
    }
  },

  estudiantes: async (req, res) => {
    try {
      const reportes = await Tutoria.aggregate([
        { $group: { _id: '$estudiante_id', cantidad_tutorias: { $sum: 1 } } },
        { $lookup: { from: 'estudiantes', localField: '_id', foreignField: 'estudiante_id', as: 'estudiante' } },
        { $unwind: '$estudiante' },
        { $sort: { cantidad_tutorias: -1 } },
        { $project: { _id: 0, estudiante_id: '$_id', nombre: '$estudiante.nombre', carrera: '$estudiante.carrera', cantidad_tutorias: 1 } }
      ])
      return res.status(200).json({ success: true, data: reportes })
    } catch (error) {
      return sendError(res, 500, 'No se pudo generar el reporte de estudiantes')
    }
  },

  asistencia: async (req, res) => {
    try {
      const asistencias = await Asistencia.aggregate([
        { $group: { _id: null, total: { $sum: 1 }, asistio: { $sum: { $cond: [{ $eq: ['$estado_estudiante', 'Asistio'] }, 1, 0] } }, tardanza: { $sum: { $cond: [{ $eq: ['$estado_estudiante', 'Tardanza'] }, 1, 0] } }, noAsistio: { $sum: { $cond: [{ $eq: ['$estado_estudiante', 'NoAsistio'] }, 1, 0] } } } },
        { $project: { _id: 0, total_registros: '$total', asistencias: '$asistio', tardanzas: '$tardanza', ausencias: '$noAsistio', porcentaje_asistencia: { $round: [{ $multiply: [{ $divide: ['$asistio', '$total'] }, 100] }, 2] } } }
      ])
      return res.status(200).json({ success: true, data: asistencias[0] || { total_registros: 0, asistencias: 0, tardanzas: 0, ausencias: 0, porcentaje_asistencia: 0 } })
    } catch (error) {
      return sendError(res, 500, 'No se pudo generar el reporte de asistencia')
    }
  },

  valoraciones: async (req, res) => {
    try {
      const reporte = await Valoracion.aggregate([
        { $group: { _id: '$tutor_id', promedio: { $avg: '$puntuacion' }, cantidad: { $sum: 1 } } },
        { $lookup: { from: 'tutores', localField: '_id', foreignField: 'tutor_id', as: 'tutor' } },
        { $unwind: '$tutor' },
        { $project: { _id: 0, tutor_id: '$_id', nombre: '$tutor.nombre', promedio: { $round: ['$promedio', 2] }, cantidad_valoraciones: '$cantidad' } },
        { $sort: { promedio: -1 } }
      ])
      return res.status(200).json({ success: true, data: reporte })
    } catch (error) {
      return sendError(res, 500, 'No se pudo generar el reporte de valoraciones')
    }
  },

  resumen: async (req, res) => {
    try {
      const [tutorias, tutores, materias, estudiantes, valoraciones] = await Promise.all([
        Tutoria.aggregate([{ $group: { _id: '$estado', total: { $sum: 1 } } }]),
        Tutor.countDocuments(),
        Materia.countDocuments(),
        Estudiante.countDocuments(),
        Valoracion.aggregate([{ $group: { _id: null, promedio: { $avg: '$puntuacion' } } }])
      ])

      return res.status(200).json({
        success: true,
        data: {
          tutorias: tutorias.reduce((acumulador, item) => ({ ...acumulador, [item._id]: item.total }), {}),
          total_tutores: tutores,
          total_materias: materias,
          total_estudiantes: estudiantes,
          promedio_valoraciones: valoraciones[0] ? Number(valoraciones[0].promedio.toFixed(2)) : 0
        }
      })
    } catch (error) {
      return sendError(res, 500, 'No se pudo generar el resumen académico')
    }
  }
}

module.exports = controller
