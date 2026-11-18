const mongoose = require('mongoose')

const tutorSchema = new mongoose.Schema({
  tutor_id: { type: String, required: true, unique: true, trim: true },
  nombre: { type: String, required: true, trim: true },
  carrera: { type: String, required: true, trim: true },
  semestre: { type: Number, required: true, min: 1, max: 12 },
  materias: { type: [String], required: true, default: [] },
  telefono: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, match: require("../middleware/validation").emailRegex, lowercase: true, trim: true },
  estado: {
    type: String,
    enum: ['Activo', 'Inactivo', 'Suspendido'],
    default: 'Activo'
  },
  experiencia: { type: Number, default: 0, min: 0 },
  fecha_registro: { type: Date, default: Date.now }
}, { versionKey: false })

module.exports = mongoose.model('Tutor', tutorSchema, 'tutores')
