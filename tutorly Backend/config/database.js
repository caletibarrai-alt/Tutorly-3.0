const mongoose = require('mongoose')

async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tutorly_db'

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
  await Promise.all(Object.values(mongoose.models).map(model => model.init()))
  console.log('MongoDB conectado correctamente')
}

module.exports = { connectDatabase }
