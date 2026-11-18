module.exports = async function comprobarDisponibilidad(datos) {
  const bloques = await require('../models/disponibilidad').find({
    tutor_id: datos.tutor_id,
  })
  const semana = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miercoles',
    'Jueves',
    'Viernes',
    'Sabado',
  ]
  if (
    bloques.length &&
    !bloques.some(
      (b) =>
        b.estado === 'Disponible' &&
        b.dia === semana[new Date(datos.fecha).getUTCDay()] &&
        b.modalidad.includes(datos.modalidad) &&
        b.hora_inicio <= datos.hora_inicio &&
        b.hora_fin >= datos.hora_fin,
    )
  )
    throw require('./cuentas').fallo(
      409,
      'El horario queda fuera de la disponibilidad del tutor',
    )
}
