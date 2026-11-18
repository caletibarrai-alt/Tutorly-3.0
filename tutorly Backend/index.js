const { loadEnv } = require('./config/env')
loadEnv()

const app = require('./app')
const { connectDatabase } = require('./config/database')

async function startServer() {
  try {
    await connectDatabase()
    app.listen(app.get('port'), '127.0.0.1', () => {
      console.log(`Servidor activo en http://localhost:${app.get('port')}`)
    })
  } catch (error) {
    console.error('No se pudo conectar a MongoDB:', error.message)
    process.exit(1)
  }
}

startServer()
