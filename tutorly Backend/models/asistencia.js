const mongoose = require('mongoose')

const asistenciaSchema = new mongoose.Schema({
  asistencia_id: { type: String, required: true, unique: true, trim: true },
  tutoria_id: { type: String, required: true, trim: true },
  estudiante_id: { type: String, required: true, trim: true },
  tutor_id: { type: String, required: true, trim: true },
  estado_estudiante: {
    type: String,
    enum: ['Asistio', 'NoAsistio', 'Tardanza'],
    required: true
  },
  estado_tutor: {
    type: String,
    enum: ['Asistio', 'NoAsistio', 'Tardanza'],
    required: true
  },
  minutos_asistencia: { type: Number, default: 0, min: 0 },
  observaciones: { type: String, default: '' }
}, { versionKey: false })

asistenciaSchema.index({ tutoria_id: 1 }, { unique: true })

module.exports = mongoose.model('Asistencia', asistenciaSchema)
