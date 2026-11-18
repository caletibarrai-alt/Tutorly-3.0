'use strict'
const $ = (id) => document.getElementById(id)
const esc = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  )
const entities = {
  tutorias: [
    'Agenda',
    'Tutoría',
    'tutoria',
    '◷',
    'estudiante_id materia_id tutor_id fecha hora_inicio hora_fin modalidad tema_solicitado estado tema_tratado resultado objetivo observaciones enlace_virtual',
  ],
  solicitudes: [
    'Solicitudes',
    'Solicitud',
    'solicitud',
    '✉',
    'estudiante_id materia_id tutor_id motivo prioridad estado',
  ],
  disponibilidad: [
    'Disponibilidad',
    'Franja',
    'disponibilidad',
    '◴',
    'tutor_id dia hora_inicio hora_fin modalidades estado',
  ],
  estudiantes: [
    'Estudiantes',
    'Estudiante',
    'estudiante',
    '♙',
    'nombre carrera semestre telefono email estado',
  ],
  tutores: [
    'Tutores',
    'Tutor',
    'tutor',
    '◎',
    'nombre carrera semestre materias telefono email experiencia estado',
  ],
  materias: [
    'Materias',
    'Materia',
    'materia',
    '▤',
    'nombre programa semestre creditos descripcion estado',
  ],
  asistencias: [
    'Asistencia',
    'Asistencia',
    'asistencia',
    '✓',
    'tutoria_id estado_estudiante estado_tutor minutos_asistencia observaciones',
  ],
  seguimientos: [
    'Seguimiento',
    'Seguimiento',
    'seguimiento',
    '↗',
    'tutoria_id tema nivel_inicial nivel_final dificultades recomendaciones requiere_nueva_tutoria',
  ],
  valoraciones: [
    'Valoraciones',
    'Valoración',
    'valoracion',
    '☆',
    'tutoria_id puntuacion comentario',
  ],
  reportes: ['Reportes', '', '', '▥', ''],
}
const groups = {
  Programación: ['tutorias', 'solicitudes', 'disponibilidad'],
  Directorio: ['estudiantes', 'tutores', 'materias'],
  Evaluación: ['asistencias', 'seguimientos', 'valoraciones', 'reportes'],
}
const enums = {
  modalidad: ['Presencial', 'Virtual'],
  modalidades: ['Presencial', 'Virtual'],
  dia: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
  prioridad: ['Media', 'Alta', 'Baja'],
  estado_estudiante: ['Asistio', 'NoAsistio', 'Tardanza'],
  estado_tutor: ['Asistio', 'NoAsistio', 'Tardanza'],
}
const states = {
  tutorias: ['Programada', 'EnCurso', 'Finalizada', 'Cancelada', 'NoAsistio'],
  solicitudes: ['Pendiente', 'Aprobada', 'Rechazada', 'Cancelada'],
  disponibilidad: ['Disponible', 'NoDisponible', 'Ocupado'],
  estudiantes: ['Activo', 'Inactivo', 'Suspendido'],
  tutores: ['Activo', 'Inactivo', 'Suspendido'],
  materias: ['Activa', 'Inactiva'],
}
const labels = {
  estudiante_id: 'Estudiante',
  tutor_id: 'Tutor',
  materia_id: 'Materia',
  solicitud_id: 'Solicitud vinculada',
  tutoria_id: 'Tutoría',
  materias: 'Materias que orienta',
  tema_solicitado: 'Tema solicitado',
  tema_tratado: 'Tema tratado',
  telefono: 'Teléfono',
  email: 'Correo',
  creditos: 'Créditos',
  descripcion: 'Descripción',
  dia: 'Día',
  modalidades: 'Modalidades',
  experiencia: 'Años de experiencia',
  enlace_virtual: 'Enlace virtual',
  minutos_asistencia: 'Minutos de asistencia',
  puntuacion: 'Calificación (1–5)',
  requiere_nueva_tutoria: 'Requiere otra tutoría',
}
const label = (k) =>
  labels[k] || (k[0].toUpperCase() + k.slice(1)).replaceAll('_', ' ')
const display = (x) =>
  ({
    NoAsistio: 'No asistió',
    EnCurso: 'En curso',
    NoDisponible: 'No disponible',
    Asistio: 'Asistió',
    Miercoles: 'Miércoles',
    Sabado: 'Sábado',
  })[x] || x
const refs = {
  estudiante_id: 'estudiantes',
  materia_id: 'materias',
  tutor_id: 'tutores',
  tutoria_id: 'tutorias',
  materias: 'materias',
}
const columns = {
  tutorias: ['materia_id', 'estudiante_id', 'fecha', 'estado'],
  solicitudes: ['motivo', 'estudiante_id', 'tutor_id', 'estado'],
  disponibilidad: ['tutor_id', 'dia', 'hora_inicio', 'modalidad', 'estado'],
  estudiantes: ['nombre', 'carrera', 'email', 'estado'],
  tutores: ['nombre', 'materias', 'email', 'estado'],
  materias: ['nombre', 'programa', 'creditos', 'estado'],
  asistencias: ['tutoria_id', 'estado_estudiante', 'estado_tutor'],
  seguimientos: ['tutoria_id', 'tema', 'nivel_inicial', 'nivel_final'],
  valoraciones: ['tutoria_id', 'puntuacion', 'comentario'],
}
const idKey = (r) => entities[r][2] + '_id'
let db = {},
  reports = {},
  page = 'tutorias',
  editing = null,
  timer
async function api(path, method = 'GET', body) {
  const res = await fetch('/api/' + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  })
  const result = await res.json()
  if (!res.ok) throw Error(result.mensaje || 'Error al consultar los datos')
  return result.data
}
function notify(s) {
  $('toast').textContent = s
  clearTimeout(timer)
  timer = setTimeout(() => ($('toast').textContent = ''), 3500)
}
function find(r, id) {
  return db[r]?.find((x) => x[idKey(r)] === id)
}
function name(r, id) {
  const row = find(r, id)
  return row?.nombre || row?.tema_solicitado || id
}
function visible(k, v) {
  if (Array.isArray(v))
    return v.map((x) => (refs[k] ? name(refs[k], x) : display(x))).join(', ')
  if (refs[k]) return name(refs[k], v)
  if (k === 'fecha') return v?.slice(0, 10)
  return display(v)
}
const opt = (v, text, selected = false) =>
  '<option value="' +
  esc(v) +
  '" ' +
  (selected ? 'selected' : '') +
  '>' +
  esc(text) +
  '</option>'
async function refresh() {
  const lists = Object.keys(entities).filter((r) => r !== 'reportes')
  const values = await Promise.all(lists.map((r) => api(r)))
  db = Object.fromEntries(lists.map((r, i) => [r, values[i]]))
  const kinds = ['materias', 'valoraciones', 'resumen']
  const data = await Promise.all(kinds.map((k) => api('reportes/' + k)))
  reports = Object.fromEntries(kinds.map((k, i) => [k, data[i]]))
}
function metric(title, n) {
  return (
    '<div class="metric"><span>' +
    esc(title) +
    '</span><strong>' +
    esc(n) +
    '</strong></div>'
  )
}
function navigate() {
  page = location.hash.slice(1)
  if (!Object.hasOwn(entities, page)) page = 'tutorias'
  const group = Object.keys(groups).find((g) => groups[g].includes(page))
  $('group').textContent = group
  $('crumb').textContent = entities[page][0]
  $('title').textContent =
    page === 'tutorias' ? 'Agenda de tutorías' : entities[page][0]
  $('create').hidden = page === 'reportes'
  $('create').textContent =
    page === 'tutorias'
      ? '＋ Programar tutoría'
      : '＋ Agregar ' + entities[page][1].toLowerCase()
  $('nav').innerHTML = Object.entries(groups)
    .map(
      ([g, rs]) =>
        '<small>' +
        g +
        '</small>' +
        rs
          .map(
            (r) =>
              '<a class="' +
              (page === r ? 'active' : '') +
              '" href="#' +
              r +
              '"><i>' +
              entities[r][3] +
              '</i>' +
              entities[r][0] +
              '</a>',
          )
          .join(''),
    )
    .join('')
  const metrics = $('metrics')
  metrics.innerHTML = ''
  if (page === 'tutorias')
    metrics.innerHTML =
      metric('Programadas', reports.resumen.tutorias.Programada || 0) +
      metric('Finalizadas', reports.resumen.tutorias.Finalizada || 0) +
      metric(
        'Tutores activos',
        db.tutores.filter((t) => t.estado === 'Activo').length,
      )
  if (page === 'reportes')
    metrics.innerHTML =
      metric('Estudiantes', reports.resumen.total_estudiantes) +
      metric('Tutorías', db.tutorias.length) +
      metric('Promedio sobre 5', reports.resumen.promedio_valoraciones)
  metrics.style.display = metrics.children.length ? 'grid' : 'none'
  $('tools').innerHTML =
    '<strong>' +
    (page === 'tutorias'
      ? 'Sesiones'
      : page === 'reportes'
        ? 'Estadísticas académicas'
        : 'Registros') +
    '</strong>'
  if (page !== 'reportes') {
    $('tools').innerHTML +=
      '<input type="search" id="search" aria-label="Buscar" placeholder="Buscar…">'
    if (page === 'tutorias')
      $('tools').innerHTML +=
        '<select id="student" aria-label="Historial por estudiante">' +
        opt('', 'Todos los estudiantes') +
        db.estudiantes.map((x) => opt(x.estudiante_id, x.nombre)).join('') +
        '</select>'
    if (page === 'tutores')
      $('tools').innerHTML +=
        '<select id="subject" aria-label="Tutores activos por materia">' +
        opt('', 'Todas las materias') +
        db.materias
          .filter((x) => x.estado === 'Activa')
          .map((x) => opt(x.materia_id, x.nombre))
          .join('') +
        '</select>'
    if (states[page])
      $('tools').innerHTML +=
        '<select id="status" aria-label="Filtrar estado">' +
        opt('', 'Todos los estados') +
        states[page].map((x) => opt(x, display(x))).join('') +
        '</select>'
  }
  render()
}
function table(headers, rows) {
  return rows.length
    ? '<table><thead><tr>' +
        headers.map((h) => '<th>' + esc(h) + '</th>').join('') +
        '</tr></thead><tbody>' +
        rows
          .map(
            (c) =>
              '<tr>' + c.map((v) => '<td>' + v + '</td>').join('') + '</tr>',
          )
          .join('') +
        '</tbody></table>'
    : '<p class="empty">No hay registros para mostrar.</p>'
}
function render() {
  if (page === 'reportes') {
    $('content').innerHTML =
      '<div class="report"><h3>Demanda por materia</h3>' +
      table(
        ['Materia', 'Tutorías'],
        reports.materias.map((x) => [esc(x.nombre), x.cantidad_tutorias]),
      ) +
      '<h3>Valoración de tutores</h3>' +
      table(
        ['Tutor', 'Promedio / 5', 'Valoraciones'],
        reports.valoraciones.map((x) => [
          esc(x.nombre),
          x.promedio,
          x.cantidad_valoraciones,
        ]),
      ) +
      '</div>'
    return
  }
  const cols = columns[page],
    query = $('search').value.toLocaleLowerCase()
  let rows = db[page].filter(
    (x) =>
      (!$('status')?.value || x.estado === $('status').value) &&
      (!$('student')?.value || x.estudiante_id === $('student').value) &&
      (!$('subject')?.value ||
        (x.estado === 'Activo' && x.materias.includes($('subject').value))) &&
      [
        x[idKey(page)],
        ...cols.map((k) => visible(k, x[k])),
        x.tutor_id && name('tutores', x.tutor_id),
        x.tema_solicitado,
      ]
        .join(' ')
        .toLocaleLowerCase()
        .includes(query),
  )
  if (page === 'tutorias')
    rows.sort(
      (a, b) =>
        b.fecha.localeCompare(a.fecha) ||
        a.hora_inicio.localeCompare(b.hora_inicio),
    )
  $('content').innerHTML = table(
    [...cols.map(label), 'Acciones'],
    rows.map((x) => {
      const id = x[idKey(page)]
      return [
        ...cols.map((k, i) => {
          const value = esc(visible(k, x[k]))
          if (k === 'estado')
            return (
              '<span class="pill ' + esc(x.estado) + '">' + value + '</span>'
            )
          let detail = i === 0 ? id : ''
          if (page === 'tutorias' && i === 0)
            detail = name('tutores', x.tutor_id) + ' · ' + id
          if (page === 'tutorias' && k === 'fecha')
            detail = x.hora_inicio + ' – ' + x.hora_fin
          return value + (detail ? '<small>' + esc(detail) + '</small>' : '')
        }),
        '<div class="actions"><button data-edit="' +
          esc(id) +
          '">Editar</button><button data-del="' +
          esc(id) +
          '">Eliminar</button></div>',
      ]
    }),
  )
}
const numeric = {
  semestre: [1, 12],
  creditos: [1, 99],
  experiencia: [0, 80],
  nivel_inicial: [1, 5],
  nivel_final: [1, 5],
  puntuacion: [1, 5],
  minutos_asistencia: [0, 1440],
}
const optional = new Set(
  'tema_tratado resultado objetivo observaciones enlace_virtual comentario descripcion dificultades recomendaciones'.split(
    ' ',
  ),
)
function field(k, row) {
  const key = k === 'modalidades' ? 'modalidad' : k
  const value = row[key] ?? ''
  const many = ['materias', 'modalidades'].includes(k)
  const items = k === 'estado' ? states[page] : enums[k]
  let control
  if (items || refs[k]) {
    let options = []
    if (items) options = items.map((v) => [v, display(v)])
    else {
      let records = db[refs[k]]
      if (
        (page === 'tutorias' || page === 'solicitudes') &&
        ['materia_id', 'estudiante_id'].includes(k)
      )
        records = records.filter(
          (x) =>
            ['Activo', 'Activa'].includes(x.estado) ||
            x[idKey(refs[k])] === value,
        )
      if (page === 'valoraciones' && k === 'tutoria_id')
        records = records.filter(
          (x) =>
            x.tutoria_id === value ||
            (x.estado === 'Finalizada' &&
              !db.valoraciones.some((v) => v.tutoria_id === x.tutoria_id)),
        )
      options = records.map((x) => [
        x[idKey(refs[k])],
        (x.nombre || x.tema_solicitado) + ' · ' + x[idKey(refs[k])],
      ])
    }
    control =
      '<select name="' +
      k +
      '" ' +
      (many ? 'multiple size="4" ' : '') +
      'required>' +
      (!many && !items ? opt('', 'Seleccionar…') : '') +
      options
        .map(([v, t]) =>
          opt(
            v,
            t,
            many ? Array.isArray(value) && value.includes(v) : v === value,
          ),
        )
        .join('') +
      '</select>'
  } else if (k === 'requiere_nueva_tutoria')
    control =
      '<select name="' +
      k +
      '">' +
      opt('false', 'No', !value) +
      opt('true', 'Sí', value === true) +
      '</select>'
  else {
    const type = numeric[k]
      ? 'number'
      : k === 'fecha'
        ? 'date'
        : k.startsWith('hora_')
          ? 'time'
          : k === 'email'
            ? 'email'
            : k === 'enlace_virtual'
              ? 'url'
              : 'text'
    const val =
      k === 'fecha'
        ? value.slice(0, 10)
        : Array.isArray(value)
          ? value.join(', ')
          : value
    control =
      '<input name="' +
      k +
      '" type="' +
      type +
      '" value="' +
      esc(val) +
      '" ' +
      (optional.has(k) ? '' : 'required ') +
      (numeric[k]
        ? 'min="' + numeric[k][0] + '" max="' + numeric[k][1] + '"'
        : '') +
      '>'
  }
  return '<label>' + esc(label(k)) + control + '</label>'
}
function updateTutors(preferred) {
  const form = $('editor').elements
  if (!['solicitudes', 'tutorias'].includes(page)) return
  const selected = preferred || form.tutor_id.value,
    materia = form.materia_id.value
  const list = db.tutores.filter(
    (t) =>
      (t.estado === 'Activo' && t.materias.includes(materia)) ||
      (editing &&
        t.tutor_id === editing.tutor_id &&
        editing.materia_id === materia),
  )
  form.tutor_id.innerHTML =
    opt(
      '',
      materia
        ? list.length
          ? 'Seleccionar…'
          : 'Sin tutores disponibles'
        : 'Selecciona una materia',
    ) +
    list.map((t) => opt(t.tutor_id, t.nombre, t.tutor_id === selected)).join('')
}
function showHours() {
  const line = $('hours')
  if (!line) return
  const tutor = $('editor').elements.tutor_id.value
  const blocks = db.disponibilidad.filter((b) => b.tutor_id === tutor)
  line.textContent = !tutor
    ? ''
    : blocks.length
      ? 'Franjas disponibles: ' +
        (blocks
          .filter((b) => b.estado === 'Disponible')
          .map(
            (b) =>
              display(b.dia) +
              ' ' +
              b.hora_inicio +
              '–' +
              b.hora_fin +
              ' (' +
              b.modalidad.join(', ') +
              ')',
          )
          .join(' · ') || 'ninguna')
      : 'Horario abierto, sujeto a cruces con otras sesiones.'
}
function openForm(row) {
  editing = row || null
  const source = row || {}
  $('formtitle').textContent =
    (row ? 'Editar ' : 'Agregar ') + entities[page][1].toLowerCase()
  $('error').textContent = ''
  $('fields').innerHTML =
    entities[page][4]
      .split(' ')
      .map((k) => field(k, source))
      .join('') +
    (page === 'tutorias' ? '<p class="wide hint" id="hours"></p>' : '')
  if (page === 'tutorias') {
    const options = db.solicitudes.filter(
      (s) =>
        ['Pendiente', 'Aprobada'].includes(s.estado) ||
        s.solicitud_id === source.solicitud_id,
    )
    const select =
      '<label class="wide">Solicitud vinculada<select name="solicitud_id">' +
      opt('', 'Reserva directa') +
      options
        .map((s) =>
          opt(
            s.solicitud_id,
            s.solicitud_id +
              ' · ' +
              name('estudiantes', s.estudiante_id) +
              ' · ' +
              s.motivo,
            s.solicitud_id === source.solicitud_id,
          ),
        )
        .join('') +
      '</select></label>'
    $('fields').insertAdjacentHTML('afterbegin', select)
  }
  updateTutors(source.tutor_id)
  showHours()
  $('dialog').showModal()
}
$('editor').addEventListener('change', (e) => {
  if (e.target.name === 'solicitud_id' && e.target.value) {
    const s = find('solicitudes', e.target.value),
      f = $('editor').elements
    f.estudiante_id.value = s.estudiante_id
    f.materia_id.value = s.materia_id
    updateTutors(s.tutor_id)
  } else if (e.target.name === 'materia_id') updateTutors()
  showHours()
})
$('editor').onsubmit = async (e) => {
  e.preventDefault()
  const button = e.submitter
  button.disabled = true
  try {
    const body = {}
    for (const k of entities[page][4].split(' ')) {
      const el = e.target.elements[k]
      let v = el.value
      if (el.multiple) v = Array.from(el.selectedOptions, (o) => o.value)
      else if (numeric[k]) v = Number(v)
      else if (k === 'requiere_nueva_tutoria') v = v === 'true'
      else if (['dificultades', 'recomendaciones'].includes(k))
        v = v
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean)
      body[k === 'modalidades' ? 'modalidad' : k] = v
    }
    if (page === 'tutorias')
      body.solicitud_id = e.target.elements.solicitud_id.value
    if (body.tutoria_id) {
      const session = find('tutorias', body.tutoria_id)
      body.estudiante_id = session.estudiante_id
      if (page === 'seguimientos') body.materia_id = session.materia_id
      else body.tutor_id = session.tutor_id
    }
    if (!editing)
      body[idKey(page)] =
        {
          tutorias: 'TU',
          solicitudes: 'S',
          disponibilidad: 'D',
          estudiantes: 'E',
          tutores: 'T',
          materias: 'M',
          asistencias: 'A',
          seguimientos: 'SE',
          valoraciones: 'V',
        }[page] +
        '-' +
        crypto.randomUUID().slice(0, 12)
    await api(
      page + (editing ? '/' + encodeURIComponent(editing[idKey(page)]) : ''),
      editing ? 'PUT' : 'POST',
      body,
    )
    await reload()
    $('dialog').close()
    notify('Registro guardado')
  } catch (err) {
    $('error').textContent = err.message
  } finally {
    button.disabled = false
  }
}
$('content').onclick = async (e) => {
  const { edit, del } = e.target.dataset
  if (edit) openForm(find(page, edit))
  if (del && confirm('¿Eliminar el registro ' + del + '?')) {
    try {
      await api(page + '/' + encodeURIComponent(del), 'DELETE')
      await reload()
      notify('Registro eliminado')
    } catch (err) {
      notify(err.message)
    }
  }
}
async function reload() {
  try {
    await refresh()
    navigate()
    $('create').disabled = false
  } catch (err) {
    $('create').disabled = true
    $('content').innerHTML =
      '<p class="empty">No se pudieron cargar los datos. ' +
      esc(err.message) +
      ' <button id="retry">Reintentar</button></p>'
    $('retry').onclick = reload
  }
}
$('tools').oninput = render
$('create').onclick = () => openForm()
document
  .querySelectorAll('[data-close]')
  .forEach((b) => (b.onclick = () => $('dialog').close()))
window.onhashchange = () => {
  if (db.tutorias) navigate()
}
$('today').textContent = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(new Date())
$('create').disabled = true
reload()
