const { fallo } = require('./cuentas')
const firmas = [
  ['pdf', '255044462d'],
  ['png', '89504e470d0a1a0a'],
  ['jpg', 'ffd8ff'],
]
exports.leer = function (valor) {
  if (!valor) return null
  if (
    typeof valor.contenido !== 'string' ||
    typeof valor.nombre !== 'string' ||
    valor.contenido.length > 4194304
  )
    throw fallo(400, 'El archivo debe pesar hasta 3 MB')
  const bytes = Buffer.from(valor.contenido, 'base64')
  const formato = firmas.find(
    ([, firma]) =>
      bytes.subarray(0, firma.length / 2).toString('hex') === firma,
  )
  if (!formato || bytes.length > 3145728)
    throw fallo(400, 'Adjunta un PDF, PNG o JPEG válido de hasta 3 MB')
  const nombre =
    valor.nombre
      .replace(/[^\w. -]/g, '_')
      .slice(0, 90)
      .replace(/\.[^.]*$/, '') || 'material'
  return { nombre: nombre + '.' + formato[0], bytes }
}
exports.enviar = function (res, archivo) {
  if (!archivo?.bytes) throw fallo(404, 'Archivo no disponible')
  res
    .set('Cache-Control', 'private, no-store')
    .set('X-Content-Type-Options', 'nosniff')
    .attachment(archivo.nombre)
    .type('application/octet-stream')
    .send(archivo.bytes)
}
