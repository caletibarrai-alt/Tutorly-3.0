const mongoose = require('mongoose')

const estudianteSchema = new mongoose.Schema({
  estudiante_id: { type: String, required: true, unique: true, trim: true },
  nombre: { type: String, required: true, trim: true },
  carrera: { type: String, required: true, trim: true },
  semestre: { type: Number, required: true, min: 1, max: 12 },
  telefono: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, match: require("../middleware/validation").emailRegex, lowercase: true, trim: true },
  estado: {
    type: String,
    enum: ['Activo', 'Inactivo', 'Suspendido'],
    default: 'Activo'
  },
  fecha_registro: { type: Date, default: Date.now }
}, { versionKey: false })

estudianteSchema.index({ email: 1 }, { unique: true })

module.exports = mongoose.model('Estudiante', estudianteSchema)
