const mongoose = require('mongoose')
const { loadEnv } = require('./config/env')
const { connectDatabase } = require('./config/database')
const demo = require('./demo.json')
const colecciones = { materias: 'materia', estudiantes: 'estudiante', tutores: 'tutor', tutorias: 'tutoria', valoraciones: 'valoracion' }

async function seed() {
  loadEnv()
  await connectDatabase()
  for (const [grupo, nombre] of Object.entries(colecciones)) {
    const Modelo = require('./models/' + nombre)
    await Modelo.init()
    for (const dato of demo[grupo]) {
      const id = nombre + '_id'
      await Modelo.updateOne({ [id]: dato[id] }, { $setOnInsert: dato }, { upsert: true, runValidators: true })
    }
  }
  console.log('Datos de ejemplo disponibles.')
}
seed().catch(e => { console.error(e.message); process.exitCode = 1 }).finally(() => mongoose.disconnect())
