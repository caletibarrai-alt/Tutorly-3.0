const mongoose = require('mongoose')

const solicitudSchema = new mongoose.Schema({
  mensajes: [{ _id:false, rol:String, texto:String, fecha:Date }],
  archivo: {nombre:String, bytes:{type:Buffer, select:false}},
  solicitud_id: { type: String, required: true, unique: true, trim: true },
  estudiante_id: { type: String, required: true, trim: true },
  materia_id: { type: String, required: true, trim: true },
  tutor_id: { type: String, required: true, trim: true },
  fecha_solicitud: { type: Date, required: true, default: Date.now },
  motivo: { type: String, required: true, trim: true },
  prioridad: {
    type: String,
    enum: ['Baja', 'Media', 'Alta'],
    required: true
  },
  estado: {
    type: String,
    enum: ['Pendiente', 'Aprobada', 'Rechazada', 'Cancelada'],
    default: 'Pendiente'
  }
}, { versionKey: false })

solicitudSchema.index({ estudiante_id: 1, materia_id: 1 })

module.exports = mongoose.model('Solicitud', solicitudSchema, 'solicitudes')
