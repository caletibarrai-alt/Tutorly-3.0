const mongoose = require('mongoose')
const schema = new mongoose.Schema({
  tutoria: String,
  estudiante: String,
  nombre: String,
  bytes: { type: Buffer, select: false },
})
schema.index({ tutoria: 1, estudiante: 1 }, { unique: true })
module.exports = mongoose.model('Material', schema, 'materiales')
