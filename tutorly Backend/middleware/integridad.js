// El servidor local procesa una escritura por vez para que comprobar y reservar
// un horario, o comprobar referencias y borrar, sean operaciones consecutivas.
const models = {
  estudiantes: 'estudiante',
  tutores: 'tutor',
  materias: 'materia',
  tutorias: 'tutoria',
  solicitudes: 'solicitud',
  asistencias: 'asistencia',
  seguimientos: 'seguimiento',
  valoraciones: 'valoracion',
  disponibilidad: 'disponibilidad',
}
const dependencias = {
  estudiante: ['solicitud', 'tutoria'],
  tutor: ['solicitud', 'tutoria', 'disponibilidad'],
  materia: ['solicitud', 'tutoria', 'tutor'],
  solicitud: ['tutoria'],
  tutoria: ['valoracion', 'asistencia', 'seguimiento'],
}
let turno = Promise.resolve()
module.exports = async function integridad(req, res, next) {
  if (!['POST', 'PUT', 'DELETE'].includes(req.method)) return next()
  const [, recurso, codigo] = req.path.split('/')
  const nombre = models[recurso]
  if (!nombre) return next()
  const id = nombre + '_id'
  const body = req.body
  const error = (status, mensaje) =>
    res.status(status).json({ success: false, mensaje })
  if (req.method !== 'DELETE') {
    const campos = require('../models/' + nombre).schema.paths
    if (
      !body ||
      Array.isArray(body) ||
      !Object.keys(body).length ||
      Object.entries(body).some(
        ([k, v]) =>
          !Object.hasOwn(campos, k) ||
          k === '_id' ||
          (v !== null &&
            typeof v === 'object' &&
            !(Array.isArray(v) && v.every((i) => typeof i === 'string'))),
      )
    )
      return error(400, 'El cuerpo debe contener campos válidos del recurso')
    if (
      req.method === 'PUT' &&
      body[id] !== undefined &&
      body[id] !== decodeURIComponent(codigo)
    )
      return error(400, 'El código del registro es permanente')
  }
  const previo = turno
  let liberar
  turno = new Promise((resolve) => {
    liberar = resolve
  })
  await previo
  if (res.destroyed) {
    liberar()
    return
  }
  res.once('finish', liberar)
  res.once('close', liberar)
  try {
    if(nombre==='tutoria' && codigo && await require('../models/tutoria').exists({tutoria_id:decodeURIComponent(codigo),tipo:{$exists:true}}))return error(409,'Esta sesión se gestiona desde la agenda del asesor')
    if(nombre==='estudiante' && req.method==='DELETE' && await require('../models/tutoria').exists({'participantes.estudiante':decodeURIComponent(codigo)}))return error(409,'Hay una inscripción vinculada')
    if (req.method === 'DELETE') {
      for (const otro of dependencias[nombre] || []) {
        const campo = otro === 'tutor' ? 'materias' : id
        if (
          await require('../models/' + otro).exists({
            [campo]: decodeURIComponent(codigo),
          })
        )
          return error(
            409,
            'Hay registros vinculados. Conserva el historial o elimina primero los registros dependientes.',
          )
      }
    }
    if (
      nombre === 'tutor' &&
      (req.method === 'POST' || body.materias !== undefined)
    ) {
      const materias = body.materias
      if (
        !Array.isArray(materias) ||
        !materias.length ||
        (await require('../models/materia').countDocuments({
          materia_id: { $in: materias },
        })) !== materias.length
      )
        return error(
          400,
          'Selecciona una o más materias existentes, sin repetir',
        )
    }
    if (nombre === 'disponibilidad' && req.method !== 'DELETE') {
      const previo =
        codigo &&
        (await require('../models/disponibilidad')
          .findOne({ disponibilidad_id: codigo })
          .lean())
      const datos = { ...previo, ...body }
      const hora = /^([01]\d|2[0-3]):[0-5]\d$/
      if (
        !hora.test(datos.hora_inicio) ||
        !hora.test(datos.hora_fin) ||
        datos.hora_fin <= datos.hora_inicio
      )
        return error(400, 'Revisa las horas de la franja')
    }
    next()
  } catch (e) {
    next(e)
  }
}
