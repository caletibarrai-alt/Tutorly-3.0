const mongoose = require('mongoose')

const valoracionSchema = new mongoose.Schema({
  valoracion_id: { type: String, required: true, unique: true, trim: true },
  tutoria_id: { type: String, required: true, unique: true, trim: true },
  estudiante_id: { type: String, required: true, trim: true },
  tutor_id: { type: String, required: true, trim: true },
  puntuacion: { type: Number, required: true, min: 1, max: 5 },
  comentario: { type: String, default: '', trim: true },
  fecha: { type: Date, default: Date.now }
}, { versionKey: false })

module.exports = mongoose.model(
  'Valoracion',
  valoracionSchema,
  'valoraciones'
)