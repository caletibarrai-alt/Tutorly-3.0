const express = require('express')
const estudianteRoutes = require('./routes/estudiante')
const tutorRoutes = require('./routes/tutor')
const materiaRoutes = require('./routes/materia')
const solicitudRoutes = require('./routes/solicitud')
const tutoriaRoutes = require('./routes/tutoria')
const asistenciaRoutes = require('./routes/asistencia')
const seguimientoRoutes = require('./routes/seguimiento')
const valoracionRoutes = require('./routes/valoracion')
const disponibilidadRoutes = require('./routes/disponibilidad')
const reporteRoutes = require('./routes/reporte')

const app = express()

app.set('port', process.env.PORT || 3000)

app.use(express.json({ limit: '5mb' }))

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API de Tutorly activa' })
})

app.use(express.static(require('path').join(__dirname, '..', 'Frontend')))
const { autenticar, permitir } = require('./middleware/autorizacion')
app.use('/api',require('./middleware/escrituras'))
app.use('/api/auth', require('./routes/auth'))
app.use('/api', autenticar)
app.use('/api/agenda',require('./routes/agenda'))
app.use('/api/campus', permitir('ESTUDIANTE','ASESOR'), require('./routes/campus'))
app.use('/api', permitir('ADMINISTRADOR'), require('./middleware/integridad'))
app.use('/api/estudiantes', estudianteRoutes)
app.use('/api/tutores', tutorRoutes)
app.use('/api/materias', materiaRoutes)
app.use('/api/solicitudes', solicitudRoutes)
app.use('/api/tutorias', tutoriaRoutes)
app.use('/api/asistencias', asistenciaRoutes)
app.use('/api/seguimientos', seguimientoRoutes)
app.use('/api/valoraciones', valoracionRoutes)
app.use('/api/disponibilidad', disponibilidadRoutes)
app.use('/api/reportes', reporteRoutes)

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error)

  if(error.code===11000)return res.status(409).json({success:false,mensaje:'El correo o perfil ya tiene una cuenta'})
  if(error.name==='ValidationError')return res.status(400).json({success:false,mensaje:'Revisa los campos obligatorios y sus valores'})
  if(error.name==='CastError')return res.status(400).json({success:false,mensaje:'Identificador inválido'})
  return res.status(error.status || 500).json({
    success: false,
    mensaje: error.status ? error.message : 'Error interno del servidor'
  })
})

module.exports = app