const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const validEstadosEstudiante = ['Activo', 'Inactivo', 'Suspendido']
const validEstadosTutor = ['Activo', 'Inactivo', 'Suspendido']
const validEstadosMateria = ['Activa', 'Inactiva']
const validPrioridades = ['Baja', 'Media', 'Alta']
const validEstadosSolicitud = ['Pendiente', 'Aprobada', 'Rechazada', 'Cancelada']
const validEstadosTutoria = ['Programada', 'EnCurso', 'Finalizada', 'Cancelada', 'NoAsistio']
const validModalidades = ['Presencial', 'Virtual']
const validEstadosAsistencia = ['Asistio', 'NoAsistio', 'Tardanza']
const validDias = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
const validEstadosDisponibilidad = ['Disponible', 'NoDisponible', 'Ocupado']

function sendError(res, status, message, details) {
  const response = { success: false, mensaje: message }
  if (details) response.detalles = details
  return res.status(status).json(response)
}

function respondNotFound(res, resource, identifier) {
  return sendError(res, 404, `${resource} ${identifier} no existe`)
}

function validateEmail(value) {
  return typeof value === 'string' && emailRegex.test(value.trim())
}

function validateNumberInRange(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max
}

function validateDate(value, label = 'La fecha') {
  if (typeof value !== 'string' || !value.trim()) return `${label} es obligatoria`
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return `${label} no es válida`
  return null
}

function validateTime(value, label = 'La hora') {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return `${label} debe tener formato HH:mm`
  }
  return null
}

function validateEnum(value, values, label) {
  if (!values.includes(value)) {
    return `${label} debe ser uno de: ${values.join(', ')}`
  }
  return null
}

function validateBody(req, res, next) {
  return next()
}

module.exports = {
  sendError,
  respondNotFound,
  validateEmail,
  validateNumberInRange,
  validateDate,
  validateTime,
  validateEnum,
  validateBody,
  validEstadosEstudiante,
  validEstadosTutor,
  validEstadosMateria,
  validPrioridades,
  validEstadosSolicitud,
  validEstadosTutoria,
  validModalidades,
  validEstadosAsistencia,
  validDias,
  validEstadosDisponibilidad,
  emailRegex
}
