const r = require('express').Router()
const { ruta, permitir } = require('../middleware/autorizacion')
const { fallo } = require('../services/cuentas')
const archivo = require('../services/archivo')
const Tutoria = require('../models/tutoria'),
  Solicitud = require('../models/solicitud'),
  Tutor = require('../models/tutor'),
  Materia = require('../models/materia'),
  Estudiante = require('../models/estudiante'),
  Material = require('../models/material')
const ok = (res, data, status = 200) =>
  res.status(status).json({ success: true, data })
const activo = ['Programada', 'EnCurso']
const hora = (d, h) =>
  new Date(new Date(d).toISOString().slice(0, 10) + 'T' + h + ':00-05:00')
const lista = (s) =>
  s.tipo
    ? s.participantes.map((p) => p.estudiante)
    : [s.estudiante_id].filter(Boolean)
const exigir = (cond, status, msg) => {
  if (!cond) throw fallo(status, msg)
}
const asesor = permitir('ASESOR'),
  estudiante = permitir('ESTUDIANTE')
async function sesion(id) {
  const s = await Tutoria.findOne({ tutoria_id: id })
  exigir(s, 404, 'Tutoría inexistente')
  return s
}
function propia(req, s) {
  exigir(
    req.cuenta.perfil === s.tutor_id,
    403,
    'Tutoría asignada a otro asesor',
  )
}
async function cruces(datos, alumnos, id) {
  const recursos = [{ tutor_id: datos.tutor_id }]
  if (datos.salon) recursos.push({ salon: datos.salon })
  if (alumnos.length)
    recursos.push(
      { estudiante_id: { $in: alumnos } },
      { 'participantes.estudiante': { $in: alumnos } },
    )
  const inicio = new Date(new Date(datos.fecha).toISOString().slice(0, 10))
  const existe = await Tutoria.exists({
    tutoria_id: { $ne: id },
    fecha: { $gte: inicio, $lt: new Date(+inicio + 86400000) },
    estado: { $in: activo },
    hora_inicio: { $lt: datos.hora_fin },
    hora_fin: { $gt: datos.hora_inicio },
    $or: recursos,
  })
  exigir(
    !existe,
    409,
    'Ya hay una reserva para el asesor, salón o estudiante en ese horario',
  )
}
r.get(
  '/',
  ruta(async (req, res) => {
    const { rol, perfil } = req.cuenta
    const filtro =
      rol === 'ADMINISTRADOR'
        ? {}
        : rol === 'ASESOR'
          ? { tutor_id: perfil }
          : {
              $or: [
                { estudiante_id: perfil },
                { 'participantes.estudiante': perfil },
                { tipo: 'Grupal', estado: 'Programada' },
              ],
            }
    const rows = await Tutoria.find(filtro)
      .sort({ fecha: 1, hora_inicio: 1 })
      .lean()
    const ids = rows.flatMap(lista)
    const nombres =
      rol === 'ESTUDIANTE'
        ? []
        : await Estudiante.find({ estudiante_id: { $in: ids } })
            .select('nombre estudiante_id')
            .lean()
    const mapa = new Map(nombres.map((x) => [x.estudiante_id, x.nombre]))
    const materials = await Material.find({
      tutoria: { $in: rows.map((x) => x.tutoria_id) },
      ...(rol === 'ESTUDIANTE' ? { estudiante: perfil } : {}),
    })
      .select('tutoria estudiante nombre')
      .lean()
    ok(
      res,
      rows.map((s) => {
        const personas = s.tipo
            ? s.participantes || []
            : lista(s).map((estudiante) => ({ estudiante })),
          votos = personas.filter((x) => x.puntos)
        const propios = personas.filter(
          (x) => rol !== 'ESTUDIANTE' || x.estudiante === perfil,
        )
        const inscrito = lista(s).includes(perfil)
        const publica = rol === 'ESTUDIANTE' && !inscrito
        return {
          tutoria_id: s.tutoria_id,
          tutor_id: s.tutor_id,
          materia_id: s.materia_id,
          tema: s.tema_solicitado,
          descripcion: s.descripcion,
          fecha: s.fecha,
          hora_inicio: s.hora_inicio,
          hora_fin: s.hora_fin,
          estado: s.estado,
          modalidad: s.modalidad,
          salon: s.salon,
          area: s.area,
          enlace: publica ? '' : s.enlace_virtual,
          tipo: s.tipo || 'Anterior',
          capacidad: s.capacidad || 1,
          inscritos: lista(s).length,
          inscrito,
          actualizado: s.actualizado,
          solicitud_id: publica ? '' : s.solicitud_id,
          promedio: votos.length
            ? votos.reduce((a, p) => a + p.puntos, 0) / votos.length
            : null,
          participantes: propios.map((p) => ({
            ...p,
            nombre: mapa.get(p.estudiante) || p.estudiante,
            archivo: materials.find(
              (m) =>
                m.tutoria === s.tutoria_id && m.estudiante === p.estudiante,
            )?.nombre,
          })),
        }
      }),
    )
  }),
)
r.post(
  '/',
  asesor,
  ruta(async (req, res) => {
    const b = req.body,
      t = req.cuenta.perfil
    const solicitud =
      b.solicitud_id &&
      (await Solicitud.findOne({
        solicitud_id: String(b.solicitud_id),
        tutor_id: t,
        estado: 'Pendiente',
      }))
    if (b.solicitud_id) exigir(solicitud, 409, 'Solicitud no disponible')
    const datos = {
      tutor_id: t,
      materia_id: solicitud?.materia_id || String(b.materia_id || ''),
      tema_solicitado: String(b.tema || '').trim(),
      descripcion: String(b.descripcion || ''),
      capacidad: solicitud ? 1 : Number(b.capacidad),
      modalidad: b.modalidad,
      fecha: b.fecha,
      hora_inicio: b.hora_inicio,
      hora_fin: b.hora_fin,
      salon:
        b.modalidad === 'Presencial'
          ? String(b.salon || '')
              .trim()
              .toUpperCase()
          : '',
      area: String(b.area || '').trim(),
      enlace_virtual: b.modalidad === 'Virtual' ? String(b.enlace || '') : '',
    }
    await validar(datos)
    exigir(
      (await Tutor.exists({
        tutor_id: t,
        materias: datos.materia_id,
        estado: 'Activo',
      })) &&
        (await Materia.exists({
          materia_id: datos.materia_id,
          estado: 'Activa',
        })),
      400,
      'Selecciona una materia asignada al asesor',
    )
    const alumnos = solicitud ? [solicitud.estudiante_id] : []
    const id = solicitud
      ? 'TU-' + solicitud.solicitud_id
      : 'TU-' + require('crypto').randomUUID()
    await cruces(datos, alumnos, id)
    const doc = await Tutoria.findOneAndUpdate(
      { tutoria_id: id },
      {
        $setOnInsert: {
          ...datos,
          tipo: solicitud ? 'Individual' : 'Grupal',
          solicitud_id: solicitud?.solicitud_id,
          estudiante_id: alumnos[0],
          participantes: alumnos.map((estudiante) => ({ estudiante })),
          actualizado: new Date(),
        },
      },
      { upsert: true, new: true, runValidators: true },
    )
    if (solicitud)
      await Solicitud.updateOne(
        { _id: solicitud._id },
        { $set: { estado: 'Aprobada' } },
      )
    ok(res, doc.tutoria_id, 201)
  }),
)
async function validar(d) {
  exigir(
    /^\d{4}-\d\d-\d\d$/.test(d.fecha) &&
      Number.isFinite(Date.parse(d.fecha)) &&
      new Date(d.fecha).toISOString().startsWith(d.fecha),
    400,
    'Fecha inválida',
  )
  exigir(
    [d.hora_inicio, d.hora_fin].every((x) =>
      /^([01]\d|2[0-3]):[0-5]\d$/.test(x),
    ) &&
      d.hora_inicio < d.hora_fin &&
      hora(d.fecha, d.hora_inicio) > new Date(),
    400,
    'Elige un horario futuro válido',
  )
  exigir(
    d.tema_solicitado &&
      Number.isInteger(d.capacidad) &&
      d.capacidad >= 1 &&
      d.capacidad <= 300,
    400,
    'Indica tema y cupo entre 1 y 300',
  )
  await require('../services/disponibilidad')(d)
  exigir(
    d.modalidad === 'Virtual'
      ? /^https?:\/\//i.test(d.enlace_virtual)
      : d.modalidad === 'Presencial' && d.salon,
    400,
    'Indica salón presencial o enlace virtual',
  )
}
r.put(
  '/:id/horario',
  asesor,
  ruta(async (req, res) => {
    const s = await sesion(req.params.id)
    propia(req, s)
    exigir(
      s.tipo && s.estado === 'Programada',
      409,
      'Solo se reprograman sesiones programadas',
    )
    const d = {
      ...s.toObject(),
      fecha: req.body.fecha,
      hora_inicio: req.body.hora_inicio,
      hora_fin: req.body.hora_fin,
      salon:
        s.modalidad === 'Presencial'
          ? String(req.body.salon || '')
              .trim()
              .toUpperCase()
          : '',
      enlace_virtual:
        s.modalidad === 'Virtual' ? String(req.body.enlace || '') : '',
    }
    await validar(d)
    await cruces(d, lista(s), s.tutoria_id)
    for (const k of [
      'fecha',
      'hora_inicio',
      'hora_fin',
      'salon',
      'enlace_virtual',
    ])
      s[k] = d[k]
    s.actualizado = new Date()
    await s.save()
    ok(res, true)
  }),
)
r.put(
  '/:id/estado',
  asesor,
  ruta(async (req, res) => {
    const s = await sesion(req.params.id)
    propia(req, s)
    exigir(
      s.tipo &&
        activo.includes(s.estado) &&
        ['Cancelada', 'Finalizada'].includes(req.body.estado),
      409,
      'Cambio de estado inválido',
    )
    if (req.body.estado === 'Finalizada')
      exigir(
        hora(s.fecha, s.hora_inicio) <= new Date(),
        409,
        'La sesión aún no comienza',
      )
    s.estado = req.body.estado
    s.actualizado = new Date()
    await s.save()
    ok(res, true)
  }),
)
r.put(
  '/:id/inscripcion',
  estudiante,
  ruta(async (req, res) => {
    const s = await sesion(req.params.id),
      id = req.cuenta.perfil
    exigir(
      s.estado === 'Programada' && hora(s.fecha, s.hora_inicio) > new Date(),
      409,
      'La inscripción está cerrada',
    )
    const p = s.participantes.find((x) => x.estudiante === id)
    if (req.body.accion === 'inscribir') {
      exigir(s.tipo === 'Grupal' && !p, 409, 'Inscripción no disponible')
      await cruces(s, [id], s.tutoria_id)
      const result = await Tutoria.updateOne(
        {
          _id: s._id,
          estado: 'Programada',
          'participantes.estudiante': { $ne: id },
          $expr: { $lt: [{ $size: '$participantes' }, '$capacidad'] },
        },
        { $push: { participantes: { estudiante: id } } },
      )
      exigir(result.modifiedCount, 409, 'Cupo agotado o inscripción duplicada')
    } else {
      exigir(p, 404, 'Inscripción inexistente')
      if (req.body.accion === 'confirmar') p.confirmado = true
      else if (req.body.accion === 'cancelar') {
        s.participantes = s.participantes.filter((x) => x.estudiante !== id)
        if (s.tipo === 'Individual') {
          s.estado = 'Cancelada'
          s.participantes = [p]
          s.actualizado = new Date()
        }
        await Material.deleteOne({ tutoria: s.tutoria_id, estudiante: id })
      } else throw fallo(400, 'Acción inválida')
      await s.save()
    }
    ok(res, true)
  }),
)
r.put(
  '/:id/asistencia',
  asesor,
  ruta(async (req, res) => {
    const s = await sesion(req.params.id)
    propia(req, s)
    exigir(
      s.estado !== 'Cancelada' && hora(s.fecha, s.hora_inicio) <= new Date(),
      409,
      'La sesión debe haber comenzado',
    )
    const p = s.participantes.find((x) => x.estudiante === req.body.estudiante)
    exigir(
      p && ['Presente', 'Ausente', 'Justificada'].includes(req.body.estado),
      400,
      'Revisa participante y estado',
    )
    exigir(
      !p.puntos || req.body.estado === 'Presente',
      409,
      'El participante ya valoró la sesión',
    )
    p.asistencia = req.body.estado
    p.registradoPor = req.cuenta.id
    p.registradoEn = new Date()
    await s.save()
    ok(res, true)
  }),
)
r.post(
  '/:id/resena',
  estudiante,
  ruta(async (req, res) => {
    const s = await sesion(req.params.id),
      p = s.participantes.find((x) => x.estudiante === req.cuenta.perfil)
    exigir(
      s.estado === 'Finalizada' && p?.asistencia === 'Presente' && !p.puntos,
      409,
      'Solo puedes valorar una vez después de participar',
    )
    exigir(
      Number.isInteger(req.body.puntos) &&
        req.body.puntos >= 1 &&
        req.body.puntos <= 5,
      400,
      'Califica entre 1 y 5',
    )
    p.puntos = req.body.puntos
    p.comentario = String(req.body.comentario || '').slice(0, 1500)
    await s.save()
    ok(res, true, 201)
  }),
)
r.put(
  '/:id/material',
  estudiante,
  ruta(async (req, res) => {
    const s = await sesion(req.params.id)
    exigir(
      lista(s).includes(req.cuenta.perfil) && activo.includes(s.estado),
      403,
      'Se requiere inscripción activa',
    )
    const adjunto = archivo.leer(req.body.archivo)
    exigir(adjunto, 400, 'Selecciona un archivo')
    await Material.updateOne(
      { tutoria: s.tutoria_id, estudiante: req.cuenta.perfil },
      { $set: adjunto },
      { upsert: true },
    )
    ok(res, true)
  }),
)
r.get(
  '/:id/material/:alumno',
  ruta(async (req, res) => {
    const s = await sesion(req.params.id),
      u = req.cuenta
    exigir(
      u.rol === 'ADMINISTRADOR' ||
        (u.rol === 'ASESOR'
          ? s.tutor_id === u.perfil
          : req.params.alumno === u.perfil && lista(s).includes(u.perfil)),
      403,
      'Acceso restringido',
    )
    archivo.enviar(
      res,
      await Material.findOne({
        tutoria: s.tutoria_id,
        estudiante: req.params.alumno,
      }).select('+bytes'),
    )
  }),
)
module.exports = r
