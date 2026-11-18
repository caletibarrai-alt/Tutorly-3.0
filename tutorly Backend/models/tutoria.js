const mongoose = require('mongoose')

const tutoriaSchema = new mongoose.Schema({
  tutoria_id: { type: String, required: true, unique: true, trim: true },
  tema_tratado: { type: String, default: "" },
  solicitud_id: { type: String, trim: true },
  estudiante_id: { type: String, trim: true },
  tipo: String, salon:String, area:String, capacidad:Number, descripcion:String, actualizado:Date,
  participantes:[{_id:false, estudiante:String, confirmado:Boolean, asistencia:String, registradoPor:String, registradoEn:Date, puntos:Number, comentario:String}],
  tutor_id: { type: String, required: true, trim: true },
  materia_id: { type: String, required: true, trim: true },
  fecha: { type: Date, required: true },
  hora_inicio: { type: String, required: true },
  hora_fin: { type: String, required: true },
  estado: {
    type: String,
    enum: ['Programada', 'EnCurso', 'Finalizada', 'Cancelada', 'NoAsistio'],
    default: 'Programada'
  },
  modalidad: { type: String, enum: ['Presencial', 'Virtual'], required: true },
  tema_solicitado: { type: String, required: true, trim: true },
  objetivo: { type: String, default: '' },
  resultado: { type: String, default: '' },
  observaciones: { type: String, default: '' },
  enlace_virtual: { type: String, default: '' },
  fecha_creacion: { type: Date, default: Date.now }
}, { versionKey: false })

module.exports = mongoose.model('Tutoria', tutoriaSchema)
