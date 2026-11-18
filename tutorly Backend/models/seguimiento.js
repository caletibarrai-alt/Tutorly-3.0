const mongoose = require('mongoose')

const seguimientoSchema = new mongoose.Schema({
  seguimiento_id: { type: String, required: true, unique: true, trim: true },
  tutoria_id: { type: String, required: true, trim: true },
  estudiante_id: { type: String, required: true, trim: true },
  materia_id: { type: String, required: true, trim: true },
  tema: { type: String, required: true, trim: true },
  nivel_inicial: { type: Number, required: true, min: 1, max: 5 },
  nivel_final: { type: Number, required: true, min: 1, max: 5 },
  dificultades: { type: [String], default: [] },
  recomendaciones: { type: [String], default: [] },
  requiere_nueva_tutoria: { type: Boolean, default: false },
  fecha: { type: Date, default: Date.now }
}, { versionKey: false })

module.exports = mongoose.model('Seguimiento', seguimientoSchema)
