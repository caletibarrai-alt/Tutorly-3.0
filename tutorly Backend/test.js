const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const app = require('./app')
const collection = require('../Pruebas/Thunder-Tutorly.json')
const { connectDatabase } = require('./config/database')

async function run() {
  // Usar exclusivamente una base nueva de prueba en el MongoDB local.
  const port = Number(process.env.TEST_MONGO_PORT || 27017)
  assert(Number.isInteger(port) && port >= 1 && port <= 65535)
  const dbName =
    'tutorly_test_' + require('node:crypto').randomUUID().replaceAll('-', '')
  process.env.MONGO_URI = 'mongodb://127.0.0.1:' + port + '/' + dbName
  await connectDatabase()
  const server = await new Promise((resolve) => {
    const http = app.listen(0, '127.0.0.1', () => resolve(http))
  })
  try {
    const clave=require('crypto').randomBytes(18).toString('hex')
    await require('./services/cuentas').crear('admin@example.test','ADMINISTRADOR','principal',clave)
    const base='http://127.0.0.1:'+server.address().port
    const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({correo:'admin@example.test',clave})})
    assert.equal(login.status,200)
    const cookie=login.headers.get('set-cookie').split(';')[0]
    for (const req of collection.requests) {
      const url = new URL(req.url)
      url.hostname = '127.0.0.1'
      url.port = server.address().port
      const response = await fetch(url, {
        method: req.method,
        headers: { 'Content-Type': 'application/json', Cookie:cookie },
        body: req.body?.raw,
      })
      const result = await response.json()
      const status = Number(req.tests[0].value)
      assert.equal(
        response.status,
        status,
        req.name + ' ' + JSON.stringify(result),
      )
      assert.equal(result.success, status < 400)
      if (req.name === 'Registrar tema tratado')
        assert.equal(
          result.data.tema_tratado,
          'Agrupar valoraciones con $group',
        )
      if (req.name === 'Historial por estudiante')
        assert.deepEqual(
          result.data.map((x) => x.tutoria_id),
          ['TU-LAB'],
        )
      if (req.name === 'Buscar tutor por materia')
        assert.deepEqual(
          result.data.map((x) => x.tutor_id),
          ['T-LAB'],
        )
      if (req.name === 'Reporte de valoraciones')
        assert.equal(result.data[0].promedio, 4)
      console.log(response.status, req.name)
    }
    await require('./scripts/probarAgenda')(base,cookie,clave)
    console.log(collection.requests.length + ' peticiones verificadas.')
  } finally {
    await new Promise((resolve) => server.close(resolve))
    console.log('Base aislada utilizada:',dbName)
    await mongoose.disconnect()
  }
}
run().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
