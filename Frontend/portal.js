'use strict'
const field = (label, name, type = 'text', extra = '') =>
  '<label>' +
  label +
  '<input name="' +
  name +
  '" type="' +
  type +
  '" ' +
  extra +
  ' required></label>'
const button = (label, action, id) =>
  '<button data-do="' +
  action +
  '" data-session="' +
  esc(id) +
  '">' +
  label +
  '</button>'
function conversacion(x) {
  const mensajes = (x.mensajes || [])
    .map(
      (m) =>
        '<p><strong>' + esc(m.rol) + '</strong> · ' + esc(m.texto) + '</p>',
    )
    .join('')
  const abierto =
    ['Aprobada', 'Pendiente'].includes(x.estado) &&
    (x.mensajes || []).length < 50
  return (
    '<details><summary>Mensajes sobre esta solicitud</summary>' +
    mensajes +
    (abierto
      ? '<form data-chat="' +
        esc(x.solicitud_id) +
        '"><label>Mensaje<textarea name="texto" maxlength="1000" required></textarea></label><button>Enviar mensaje</button></form>'
      : '') +
    '</details>'
  )
}
function attachment(x) {
  return x.archivo?.nombre
    ? '<p><a href="/api/campus/solicitudes/' +
        encodeURIComponent(x.solicitud_id) +
        '/archivo">Descargar ' +
        esc(x.archivo.nombre) +
        '</a></p>'
    : ''
}
async function formPayload(form) {
  const b = Object.fromEntries(new FormData(form)),
    f = b.adjunto
  if (form.elements.materias) b.materias = new FormData(form).getAll('materias')
  delete b.adjunto
  if (f?.size) {
    if (f.size > 3145728) throw Error('El máximo por archivo es 3 MB')
    b.archivo = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () =>
        resolve({ nombre: f.name, contenido: reader.result.split(',')[1] })
      reader.onerror = () => reject(Error('No se pudo leer el archivo'))
      reader.readAsDataURL(f)
    })
  }
  return b
}
function accountPicker() {
  const f = el('account'),
    update = () => {
      const student = f.rol.value === 'ESTUDIANTE',
        key = student ? 'estudiante_id' : 'tutor_id'
      const candidates = (student ? data.estudiantes : data.profesores).filter(
        (x) =>
          x.estado === 'Activo' &&
          !data.cuentas.some(
            (u) => u.perfil === x[key] && u.rol === f.rol.value,
          ),
      )
      f.perfil.innerHTML =
        options(candidates, key) +
        '<option value="nuevo">Registrar una persona nueva…</option>'
      f.perfil.onchange = () => {
        const nuevo = f.perfil.value === 'nuevo'
        let div = f.querySelector('fieldset')
        if (!div) {
          div = document.createElement('fieldset')
          f.perfil.parentElement.after(div)
        }
        div.innerHTML = nuevo
          ? field('Nombre', 'nombre') +
            field('Carrera', 'carrera') +
            field('Semestre', 'semestre', 'number', 'min="1" max="12"') +
            field('Teléfono', 'telefono') +
            (student
              ? ''
              : '<label>Materias<select required multiple name="materias">' +
                options(data.materias, 'materia_id') +
                '</select></label>')
          : ''
        if (!nuevo)
          f.correo.value =
            candidates.find((x) => x[key] === f.perfil.value)?.email || ''
      }
      f.perfil.onchange()
    }
  f.rol.onchange = update
  update()
}
function sessionForm(request, session) {
  const subjects =
    data.profesores.find((t) => t.tutor_id === user.perfil)?.materias || []
  const panel = el('panel')
  panel.innerHTML =
    '<form id="schedule"><h2>' +
    (session
      ? 'Reprogramar'
      : request
        ? 'Aprobar y agendar'
        : 'Publicar tutoría') +
    '</h2>' +
    (!session
      ? '<label>Materia<select required name="materia_id">' +
        options(
          data.materias.filter((m) =>
            request
              ? m.materia_id === request.materia_id
              : subjects.includes(m.materia_id),
          ),
          'materia_id',
        ) +
        '</select></label>' +
        field(
          'Tema',
          'tema',
          'text',
          'value="' + esc(request?.motivo || '') + '"',
        ) +
        '<label>Descripción<textarea name="descripcion"></textarea></label>' +
        (!request
          ? field(
              'Cupo máximo',
              'capacidad',
              'number',
              'min="1" max="300" value="10"',
            )
          : '')
      : '') +
    field(
      'Fecha',
      'fecha',
      'date',
      'value="' + esc(session?.fecha.slice(0, 10) || '') + '"',
    ) +
    field(
      'Inicio',
      'hora_inicio',
      'time',
      'value="' + esc(session?.hora_inicio || '') + '"',
    ) +
    field(
      'Fin',
      'hora_fin',
      'time',
      'value="' + esc(session?.hora_fin || '') + '"',
    ) +
    '<label>Modalidad<select name="modalidad" ' +
    (session ? 'disabled' : '') +
    '><option>Presencial</option><option>Virtual</option></select></label><div id="venue"></div>' +
    (!session ? field('Área o ubicación', 'area') : '') +
    '<button class="primary">Guardar</button></form>'
  const f = el('schedule')
  f.modalidad.value = session?.modalidad || 'Presencial'
  const venue = () =>
    (el('venue').innerHTML =
      f.modalidad.value === 'Virtual'
        ? field(
            'Enlace',
            'enlace',
            'url',
            'value="' + esc(session?.enlace || '') + '"',
          )
        : field(
            'Salón',
            'salon',
            'text',
            'value="' + esc(session?.salon || '') + '"',
          ))
  f.modalidad.onchange = venue
  venue()
  f.onsubmit = (e) => {
    e.preventDefault()
    action(e.submitter, async () => {
      const b = await formPayload(f)
      if (request) b.solicitud_id = request.solicitud_id
      await api(
        session
          ? 'agenda/' + encodeURIComponent(session.tutoria_id) + '/horario'
          : 'agenda',
        session ? 'PUT' : 'POST',
        b,
      )
      view = 'Mi agenda'
      await refresh()
    })
  }
}
const materiaNombre = (id) =>
  data.materias.find((x) => x.materia_id === id)?.nombre || id
const tutorNombre = (id) =>
  data.profesores.find((x) => x.tutor_id === id)?.nombre || id
function details(s) {
  const id = s.tutoria_id,
    student = user.rol === 'ESTUDIANTE',
    p = s.participantes[0],
    future =
      new Date(s.fecha.slice(0, 10) + 'T' + s.hora_inicio + ':00-05:00') >
      new Date()
  let actions = ''
  if (s.tipo !== 'Anterior') {
    if (student && s.estado === 'Programada' && future) {
      if (!s.inscrito && s.inscritos < s.capacidad)
        actions += button('Inscribirme', 'inscribir', id)
      if (s.inscrito)
        actions +=
          (p?.confirmado
            ? 'Asistencia confirmada '
            : button('Confirmar que asistiré', 'confirmar', id)) +
          button('Cancelar mi inscripción', 'cancelar', id)
    }

    if (!student && s.estado === 'Programada')
      actions +=
        button('Reprogramar', 'editar', id) +
        button('Cancelar sesión', 'Cancelada', id) +
        (!future ? button('Finalizar', 'Finalizada', id) : '')
    if (
      student &&
      s.estado === 'Finalizada' &&
      p?.asistencia === 'Presente' &&
      !p.puntos
    )
      actions +=
        '<form data-review="' +
        esc(id) +
        '"><label>Calificación<select name="puntos">' +
        [5, 4, 3, 2, 1]
          .map((n) => '<option value="' + n + '">' + n + ' ★</option>')
          .join('') +
        '</select></label><label>Comentario<textarea name="comentario"></textarea></label><button>Guardar reseña</button></form>'
  }
  if (student && s.inscrito && s.estado === 'Programada')
    actions +=
      '<form data-upload="' +
      esc(id) +
      '"><label>Material para el profesor<input type="file" name="adjunto" accept=".jpg,.jpeg,.png,.pdf" required></label><button>Subir material</button></form>'
  const roster = s.participantes
    .map(
      (p) =>
        '<p>' +
        esc(p.nombre) +
        ' · ' +
        esc(p.asistencia || 'Por registrar') +
        (p.confirmado ? ' · Confirmó' : '') +
        (p.puntos ? ' · ' + p.puntos + ' ★ ' + esc(p.comentario) : '') +
        (p.archivo
          ? ' <a href="/api/agenda/' +
            encodeURIComponent(id) +
            '/material/' +
            encodeURIComponent(p.estudiante) +
            '">Descargar ' +
            esc(p.archivo) +
            '</a>'
          : '') +
        '</p>' +
        (!student &&
        s.tipo !== 'Anterior' &&
        !future &&
        s.estado !== 'Cancelada'
          ? '<form data-att="' +
            esc(id) +
            '"><input type="hidden" name="estudiante" value="' +
            esc(p.estudiante) +
            '"><label>Asistencia<select name="estado">' +
            ['Presente', 'Ausente', 'Justificada']
              .map(
                (v) =>
                  '<option ' +
                  (p.asistencia === v ? 'selected' : '') +
                  '>' +
                  v +
                  '</option>',
              )
              .join('') +
            '</select></label><button>Registrar asistencia</button></form>'
          : ''),
    )
    .join('')
  return (
    '<h3>' +
    esc(s.tema) +
    '</h3><p>' +
    esc(materiaNombre(s.materia_id)) +
    ' · ' +
    esc(tutorNombre(s.tutor_id)) +
    '</p><p>' +
    esc(s.fecha.slice(0, 10)) +
    ' · ' +
    esc(s.hora_inicio) +
    ' – ' +
    esc(s.hora_fin) +
    ' · ' +
    esc(s.salon || s.modalidad) +
    ' ' +
    esc(s.area) +
    '</p><p>' +
    esc(s.descripcion) +
    ' ' +
    esc(s.enlace) +
    '</p><p>' +
    esc(s.estado) +
    ' · ' +
    s.inscritos +
    '/' +
    s.capacidad +
    ' plazas' +
    (s.promedio ? ' · ' + s.promedio.toFixed(1) + ' ★' : '') +
    '</p>' +
    actions +
    roster
  )
}
function drawPortal(tab, panel) {
  if (tab === 'Publicar tutoría') {
    sessionForm()
    return true
  }
  if (tab === 'Demanda por materia') {
    panel.innerHTML = cards(data.materias, (m) => {
      const sessions = data.sesiones.filter(
        (s) => s.materia_id === m.materia_id,
      )
      return (
        '<h3>' +
        esc(m.nombre) +
        '</h3><p>Solicitudes pendientes: ' +
        data.solicitudes.filter(
          (x) => x.estado === 'Pendiente' && x.materia_id === m.materia_id,
        ).length +
        ' · Grupos llenos programados: ' +
        sessions.filter(
          (s) =>
            s.tipo === 'Grupal' &&
            s.estado === 'Programada' &&
            s.inscritos === s.capacidad,
        ).length +
        ' · Presentes en sesiones 3.0: ' +
        sessions
          .flatMap((s) => s.participantes)
          .filter((p) => p.asistencia === 'Presente').length +
        '</p>'
      )
    })
    return true
  }
  if (tab === 'Avisos') {
    panel.innerHTML =
      cards(
        data.sesiones
          .filter((s) => s.actualizado && (user.rol === 'ASESOR' || s.inscrito))
          .sort((a, b) => b.actualizado.localeCompare(a.actualizado)),
        (s) =>
          '<strong>' +
          esc(s.tema) +
          ' · ' +
          esc(s.estado) +
          '</strong><p>' +
          esc(s.fecha.slice(0, 10)) +
          ' ' +
          esc(s.hora_inicio) +
          ' · ' +
          esc(s.salon || s.modalidad) +
          '</p>',
      ) +
      cards(
        data.solicitudes.filter((s) => s.estado !== 'Pendiente'),
        (s) => esc(s.motivo) + ' · ' + esc(s.estado),
      )
    return true
  }
  if (['Reseñas', 'Asistencias'].includes(tab)) {
    const review = tab === 'Reseñas',
      members = data.sesiones
        .flatMap((s) => s.participantes.map((p) => ({ ...p, tema: s.tema })))
        .filter((p) => (review ? p.puntos : p.asistencia))
    const legacy = review ? data.resenas : data.asistencias
    const scores = review
      ? [...members.map((p) => p.puntos), ...legacy.map((v) => v.puntuacion)]
      : []
    panel.innerHTML =
      (scores.length
        ? '<p>Promedio: ' +
          (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) +
          ' ★</p>'
        : '') +
      cards(
        [
          ...members.map((p) => [
            p.tema,
            review ? p.puntos + ' ★ ' + (p.comentario || '') : p.asistencia,
          ]),
          ...legacy.map((v) => [
            v.tutoria_id,
            review
              ? v.puntuacion + ' ★ ' + (v.comentario || '')
              : v.estado_estudiante,
          ]),
        ],
        (v) => '<strong>' + esc(v[0]) + '</strong><p>' + esc(v[1]) + '</p>',
      )
    return true
  }
  if (!['Mi agenda', 'Explorar tutorías'].includes(tab)) return false
  const explore = tab === 'Explorar tutorías'
  const list = data.sesiones.filter((s) =>
    explore
      ? s.tipo === 'Grupal' &&
        s.estado === 'Programada' &&
        new Date(s.fecha.slice(0, 10) + 'T' + s.hora_inicio + ':00-05:00') >
          new Date()
      : user.rol === 'ASESOR' || s.inscrito,
  )
  panel.innerHTML =
    '<label>Buscar por materia, profesor, tema, horario o ubicación<input type="search" id="busca"></label><div id="ses"></div>'
  const render = () => {
    const q = el('busca').value.toLocaleLowerCase()
    el('ses').innerHTML = cards(
      list.filter((s) =>
        [
          s.tema,
          s.fecha,
          s.hora_inicio,
          s.hora_fin,
          s.area,
          s.salon,
          materiaNombre(s.materia_id),
          tutorNombre(s.tutor_id),
        ]
          .join(' ')
          .toLocaleLowerCase()
          .includes(q),
      ),
      details,
    )
  }
  el('busca').oninput = render
  render()
  return true
}
document.addEventListener('click', (e) => {
  const { do: op, session: id } = e.target.dataset
  if (!op) return
  if (op === 'editar') {
    sessionForm(
      null,
      data.sesiones.find((s) => s.tutoria_id === id),
    )
    return
  }
  if (!confirm('¿Confirmar esta acción?')) return
  action(e.target, async () => {
    const state = ['Cancelada', 'Finalizada'].includes(op)
    await api(
      'agenda/' + encodeURIComponent(id) + (state ? '/estado' : '/inscripcion'),
      'PUT',
      state ? { estado: op } : { accion: op },
    )
    await refresh()
  })
})
document.addEventListener('submit', (e) => {
  const f = e.target,
    { upload, review, att } = f.dataset
  if (f.dataset.chat) {
    e.preventDefault()
    action(e.submitter, async () => {
      await api(
        'campus/solicitudes/' +
          encodeURIComponent(f.dataset.chat) +
          '/mensajes',
        'POST',
        { texto: f.elements.texto.value },
      )
      await refresh()
    })
    return
  }
  if (!upload && !review && !att) return
  e.preventDefault()
  action(e.submitter, async () => {
    const b = await formPayload(f)
    if (review) b.puntos = Number(b.puntos)
    await api(
      'agenda/' +
        encodeURIComponent(upload || review || att) +
        '/' +
        (upload ? 'material' : review ? 'resena' : 'asistencia'),
      review ? 'POST' : 'PUT',
      b,
    )
    await refresh()
  })
})
