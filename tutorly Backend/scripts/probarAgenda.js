const assert = require('node:assert/strict')
module.exports = async function probarAgenda(base, admin, clave) {
  async function call(cookie, path, method = 'GET', body, status = 200) {
    const res = await fetch(base + '/api/' + path, {
      method,
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: body && JSON.stringify(body),
    })
    const json = await res.json()
    assert.equal(res.status, status, path + ' ' + JSON.stringify(json))
    return json.data
  }
  async function cuenta(rol, nombre) {
    const correo = nombre + '@example.test'
    const datos = await call(
      admin,
      'auth/cuentas',
      'POST',
      {
        rol,
        perfil: 'nuevo',
        nombre,
        correo,
        clave,
        carrera: 'Ingeniería',
        semestre: 3,
        telefono: '3001112233',
        materias: ['MAT'],
      },
      201,
    )
    const login = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, clave }),
    })
    assert.equal(login.status, 200)
    return { ...datos, cookie: login.headers.get('set-cookie').split(';')[0] }
  }
  await call(
    admin,
    'materias',
    'POST',
    {
      materia_id: 'MAT',
      nombre: 'Álgebra',
      programa: 'Ingeniería',
      semestre: 3,
      creditos: 3,
    },
    201,
  )
  const prof = await cuenta('ASESOR', 'docente'),
    otro = await cuenta('ASESOR', 'segundo')
  const a = await cuenta('ESTUDIANTE', 'ana'),
    b = await cuenta('ESTUDIANTE', 'luis')
  const bytes = Buffer.from('%PDF-1.4\nEjercicio\n%%EOF'),
    archivo = { nombre: 'ejercicio.pdf', contenido: bytes.toString('base64') }
  const solicitud = await call(
    a.cookie,
    'campus/solicitudes',
    'POST',
    {
      materia_id: 'MAT',
      tutor_id: prof.perfil,
      motivo: 'Despejar ecuaciones',
      archivo,
    },
    201,
  )
  assert.equal(solicitud.archivo.bytes, undefined)
  const ruta = 'campus/solicitudes/' + solicitud.solicitud_id + '/archivo'
  const descargar = (cookie, path) =>
    fetch(base + '/api/' + path, { headers: { Cookie: cookie } })
  await call(
    prof.cookie,
    'campus/solicitudes/' + solicitud.solicitud_id + '/mensajes',
    'POST',
    { texto: 'Trae el ejercicio 2' },
    201,
  )
  await call(
    b.cookie,
    'campus/solicitudes/' + solicitud.solicitud_id + '/mensajes',
    'POST',
    { texto: 'Hola' },
    409,
  )
  const descarga = await descargar(prof.cookie, ruta)
  assert.equal(descarga.status, 200)
  assert.deepEqual(Buffer.from(await descarga.arrayBuffer()), bytes)
  assert.equal((await descargar(b.cookie, ruta)).status, 404)
  assert.equal((await descargar(otro.cookie, ruta)).status, 404)
  const fecha = new Date(Date.now() + 86400000 * 8).toISOString().slice(0, 10)
  const sesion = {
    materia_id: 'MAT',
    tema: 'Ecuaciones',
    fecha,
    hora_inicio: '09:00',
    hora_fin: '10:00',
    modalidad: 'Presencial',
    salon: 'A101',
    capacidad: 1,
  }
  await call(
    prof.cookie,
    'agenda',
    'POST',
    { ...sesion, solicitud_id: solicitud.solicitud_id },
    201,
  )
  await call(otro.cookie, 'agenda', 'POST', sesion, 409)
  const id = await call(
    prof.cookie,
    'agenda',
    'POST',
    { ...sesion, hora_inicio: '11:00', hora_fin: '12:00' },
    201,
  )
  const path = 'agenda/' + id
  const inscribir = (c) =>
    fetch(base + '/api/' + path + '/inscripcion', {
      method: 'PUT',
      headers: { Cookie: c.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'inscribir' }),
    })
  const respuestas = await Promise.all([inscribir(a), inscribir(b)])
  assert.deepEqual(respuestas.map((r) => r.status).sort(), [200, 409])
  const [ganador, fuera] = respuestas[0].ok ? [a, b] : [b, a]
  await call(ganador.cookie, path + '/material', 'PUT', { archivo })
  const material = path + '/material/' + ganador.perfil
  assert.deepEqual(
    Buffer.from(await (await descargar(prof.cookie, material)).arrayBuffer()),
    bytes,
  )
  assert.equal((await descargar(fuera.cookie, material)).status, 403)
  await call(ganador.cookie, path + '/inscripcion', 'PUT', {
    accion: 'confirmar',
  })
  const externas = await call(fuera.cookie, 'agenda')
  assert.equal(
    externas.find((s) => s.tutoria_id === id).participantes.length,
    0,
  )
  await call(
    ganador.cookie,
    path + '/asistencia',
    'PUT',
    { estudiante: ganador.perfil, estado: 'Presente' },
    403,
  )
  await require('../models/tutoria').updateOne(
    { tutoria_id: id },
    { fecha: new Date(Date.now() - 86400000) },
  )
  await call(prof.cookie, path + '/asistencia', 'PUT', {
    estudiante: ganador.perfil,
    estado: 'Presente',
  })
  await call(prof.cookie, path + '/estado', 'PUT', { estado: 'Finalizada' })
  await call(ganador.cookie, path + '/resena', 'POST', { puntos: 5 }, 201)
  await call(ganador.cookie, path + '/resena', 'POST', { puntos: 5 }, 409)
  await call(
    ganador.cookie,
    'auth/cuentas/' + fuera.id + '/administrador',
    'PUT',
    {},
    403,
  )
  await call(admin, 'auth/cuentas/' + fuera.id + '/administrador', 'PUT', {})
  await call(fuera.cookie, 'auth/yo', 'GET', undefined, 401)
  console.log(
    'Agenda, adjuntos privados, cupo concurrente, asistencia, reseña y permisos verificados.',
  )
}
