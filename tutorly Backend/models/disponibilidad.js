const mongoose = require('mongoose')

const disponibilidadSchema = new mongoose.Schema({
  disponibilidad_id: { type: String, required: true, unique: true, trim: true },
  tutor_id: { type: String, required: true, trim: true },
  dia: {
    type: String,
    enum: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
    required: true
  },
  hora_inicio: { type: String, required: true },
  hora_fin: { type: String, required: true },
  modalidad: {
    type: [String],
    enum: ['Presencial', 'Virtual'],
    required: true,
    validate: value => value.length > 0
  },
  estado: {
    type: String,
    enum: ['Disponible', 'NoDisponible', 'Ocupado'],
    default: 'Disponible'
  }
}, { versionKey: false })

module.exports = mongoose.model(
  'Disponibilidad',
  disponibilidadSchema,
  'disponibilidad_tutores'
)
