// Una instancia local comparte el turno entre el panel académico y la agenda.
let anterior = Promise.resolve()
module.exports = async (req, res, next) => {
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) return next()
  const espera = anterior
  let liberar
  anterior = new Promise((resolve) => {
    liberar = resolve
  })
  await espera
  if (res.destroyed) {
    liberar()
    return
  }
  res.once('finish', liberar)
  res.once('close', liberar)
  next()
}
