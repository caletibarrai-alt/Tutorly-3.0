const mongoose = require('mongoose')

const materiaSchema = new mongoose.Schema({
  materia_id: { type: String, required: true, unique: true, trim: true },
  nombre: { type: String, required: true, unique: true, trim: true },
  programa: { type: String, required: true, trim: true },
  semestre: { type: Number, required: true, min: 1, max: 12 },
  creditos: { type: Number, required: true, min: 1 },
  descripcion: { type: String, default: '' },
  estado: {
    type: String,
    enum: ['Activa', 'Inactiva'],
    default: 'Activa'
  }
}, { versionKey: false })

module.exports = mongoose.model('Materia', materiaSchema)
