'use strict'
const el = (id) => document.getElementById(id)
const esc = (x) =>
  String(x ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  )
let user,
  data = {},
  view
const academic = () => user.rol !== 'ADMINISTRADOR'
async function api(path, method = 'GET', body) {
  const res = await fetch('/api/' + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
    cache: 'no-store',
  })
  const result = await res.json()
  if (!res.ok) {
    if (res.status === 401 && user) location.replace('/')
    throw Error(result.mensaje)
  }
  return result.data
}
function notice(msg) {
  el('notice').textContent = msg
}
async function action(button, fn) {
  button.disabled = true
  notice('Procesando…')
  try {
    await fn()
    notice('')
  } catch (e) {
    notice(e.message)
  } finally {
    button.disabled = false
  }
}
el('login').onsubmit = (e) => {
  e.preventDefault()
  action(e.submitter, async () => {
    await api('auth/login', 'POST', Object.fromEntries(new FormData(e.target)))
    location.reload()
  })
}
el('logout').onclick = (e) =>
  action(e.target, async () => {
    await api('auth/salir', 'POST', {})
    location.reload()
  })
function options(list, id) {
  return list
    .map(
      (x) =>
        '<option value="' + esc(x[id]) + '">' + esc(x.nombre) + '</option>',
    )
    .join('')
}
function cards(list, render) {
  return list.length
    ? list.map((x) => '<article>' + render(x) + '</article>').join('')
    : '<p>Todavía no hay registros.</p>'
}
function show(tab) {
  view = tab
  el('title').textContent = tab
  const panel = el('panel'),
    student = user.rol === 'ESTUDIANTE'
  if (drawPortal(tab, panel)) return
  if (tab === 'Perfil') {
    panel.innerHTML =
      '<h2>' +
      esc(user.datos.nombre) +
      '</h2><p>' +
      esc(user.correo) +
      '</p><p>' +
      esc(user.datos.carrera || 'Administración del campus') +
      '</p><p>' +
      esc(user.datos.estado) +
      '</p>'
    return
  }
  if (tab === 'Cuentas') {
    panel.innerHTML =
      '<form id="account"><label>Rol<select name="rol"><option>ESTUDIANTE</option><option>ASESOR</option></select></label><label>Persona del directorio<select name="perfil" required></select></label><label>Correo de acceso<input name="correo" type="email" required></label><label>Contraseña inicial (mínimo 12 caracteres)<input name="clave" type="password" minlength="12" maxlength="150" required></label><button class="primary">Crear cuenta</button></form>' +
      cards(
        data.cuentas,
        (x) =>
          '<strong>' +
          esc(x.correo) +
          '</strong><p>' +
          esc(x.rol) +
          ' · ' +
          (x.activo ? 'Activa' : 'Suspendida') +
          '</p>' +
          (x.rol === 'ADMINISTRADOR'
            ? ''
            : '<button data-account="' +
              esc(x.id) +
              '">' +
              (x.activo ? 'Suspender' : 'Reactivar') +
              '</button><button data-promote="' +
              esc(x.id) +
              '">Otorgar administración</button>'),
      )
    accountPicker()
    return
  }
  if (tab === 'Solicitar asesoría') {
    panel.innerHTML =
      '<form id="request"><label>Materia<select id="subject" name="materia_id" required>' +
      options(data.materias, 'materia_id') +
      '</select></label><label>Profesor<select id="teacher" name="tutor_id" required></select></label><label>¿En qué necesitas apoyo?<textarea name="motivo" required maxlength="1500"></textarea></label><label>Material opcional (foto JPG, PNG o PDF, hasta 3 MB)<input name="adjunto" type="file" accept=".jpg,.jpeg,.png,.pdf"></label><p id="dispo"></p><button class="primary">Enviar solicitud</button></form>'
    const filter = () => {
      el('teacher').innerHTML = options(
        data.profesores.filter((t) => t.materias.includes(el('subject').value)),
        'tutor_id',
      )
      const empty = !el('teacher').options.length
      el('dispo').textContent = empty
        ? 'Sin asesores disponibles para esta materia.'
        : ''
      el('request').querySelector('button').disabled = empty
    }
    el('subject').onchange = filter
    filter()
    return
  }
  if (tab === 'Solicitudes') {
    panel.innerHTML = cards(
      data.solicitudes,
      (x) =>
        '<h3>' +
        esc(x.motivo) +
        '</h3><p>' +
        esc(x.estado) +
        ' · ' +
        esc(x.materia_id) +
        '</p>' +
        attachment(x) +
        conversacion(x) +
        (x.estado === 'Pendiente'
          ? (student ? ['Cancelada'] : ['Aprobada', 'Rechazada'])
              .map(
                (s) =>
                  '<button data-state="' +
                  s +
                  '" data-id="' +
                  esc(x.solicitud_id) +
                  '">' +
                  {
                    Cancelada: 'Cancelar',
                    Aprobada: 'Aprobar',
                    Rechazada: 'Rechazar',
                  }[s] +
                  '</button>',
              )
              .join('')
          : ''),
    )
    return
  }
  if (tab === 'Reseñas') {
    panel.innerHTML = cards(
      data.resenas,
      (x) =>
        '<h3>' +
        esc(x.puntuacion) +
        ' / 5</h3><p>' +
        esc(x.comentario) +
        '</p>',
    )
    return
  }
  if (tab === 'Asistencias') {
    panel.innerHTML = cards(
      data.asistencias,
      (x) =>
        '<h3>' +
        esc(x.tutoria_id) +
        '</h3><p>' +
        esc(x.estudiante_id) +
        ' · ' +
        esc(x.estado_estudiante) +
        '</p>',
    )
    return
  }
  panel.innerHTML = cards(
    data.agenda,
    (x) =>
      '<h3>' +
      esc(x.tema_solicitado) +
      '</h3><p>' +
      esc(x.fecha.slice(0, 10)) +
      ' · ' +
      esc(x.hora_inicio) +
      ' – ' +
      esc(x.hora_fin) +
      '</p><p>' +
      esc(x.modalidad) +
      ' · ' +
      esc(x.estado) +
      '</p>',
  )
}
async function refresh() {
  if (academic()) data = await api('campus')
  else {
    const keys = [
      'cuentas',
      'estudiantes',
      'profesores',
      'materias',
      'solicitudes',
    ]
    const paths = [
      'auth/cuentas',
      'estudiantes',
      'tutores',
      'materias',
      'solicitudes',
    ]
    const values = await Promise.all(paths.map((p) => api(p)))
    data = Object.fromEntries(keys.map((k, i) => [k, values[i]]))
  }
  data.sesiones = await api('agenda')
  show(view)
}
el('panel').addEventListener('submit', (e) => {
  if (!['request', 'account'].includes(e.target.id)) return
  e.preventDefault()
  action(e.submitter, async () => {
    await api(
      e.target.id === 'request' ? 'campus/solicitudes' : 'auth/cuentas',
      'POST',
      await formPayload(e.target),
    )
    if (e.target.id === 'request') view = 'Solicitudes'
    await refresh()
  })
})
el('panel').onclick = (e) => {
  const { account, state, id, promote } = e.target.dataset
  if (
    promote &&
    confirm('¿Otorgar permisos completos de administración a esta persona?')
  )
    return action(e.target, async () => {
      await api('auth/cuentas/' + promote + '/administrador', 'PUT', {})
      await refresh()
    })
  if (account || state) {
    if (state === 'Aprobada') {
      sessionForm(data.solicitudes.find((x) => x.solicitud_id === id))
      return
    }
    if (!confirm('¿Confirmas este cambio?')) return
    action(e.target, async () => {
      if (account)
        await api('auth/cuentas/' + account, 'PUT', {
          activo: !data.cuentas.find((x) => x.id === account).activo,
        })
      else
        await api('campus/solicitudes/' + encodeURIComponent(id), 'PUT', {
          estado: state,
        })
      await refresh()
    })
  }
}
async function init() {
  const res = await fetch('/api/auth/yo', { cache: 'no-store' })
  if (res.status === 401) return
  if (!res.ok) throw Error('No se pudo consultar la sesión')
  user = (await res.json()).data
  el('identity').textContent = user.correo
  el('role').textContent = user.rol
  el('logout').hidden = false
  const tabs = academic()
    ? [
        'Mi agenda',
        ...(user.rol === 'ESTUDIANTE'
          ? ['Explorar tutorías']
          : ['Publicar tutoría']),
        'Avisos',
        'Solicitudes',
        ...(user.rol === 'ESTUDIANTE' ? ['Solicitar asesoría'] : []),
        'Asistencias',
        'Reseñas',
        'Perfil',
      ]
    : ['Cuentas', 'Demanda por materia', 'Perfil']
  view = tabs[0]
  el('menu').innerHTML =
    tabs.map((t) => '<button>' + t + '</button>').join('') +
    (academic() ? '' : '<a href="/gestion.html">Gestión académica →</a>')
  el('menu').onclick = (e) => {
    if (e.target.tagName === 'BUTTON') show(e.target.textContent)
  }
  await refresh()
}
init().catch((e) => notice(e.message))
