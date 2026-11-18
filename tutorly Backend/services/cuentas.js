const crypto=require('node:crypto')
const derivar=require('node:util').promisify(crypto.scrypt)
const Usuario=require('../models/usuario')
const Estudiante=require('../models/estudiante')
const Tutor=require('../models/tutor')
const perfiles={ESTUDIANTE:[Estudiante,'estudiante_id'],ASESOR:[Tutor,'tutor_id']}
const fallo=(status,message)=>Object.assign(new Error(message),{status})
async function perfil(u){
  if(u.rol==='ADMINISTRADOR')return {nombre:'Administración',estado:'Activo'}
  const [modelo,campo]=perfiles[u.rol]
  return modelo.findOne({[campo]:u.perfil}).select('-_id').lean()
}
async function crear(correo,rol,id,clave){
  if(typeof correo!=='string'||!/^\S+@\S+\.\S+$/.test(correo)||typeof clave!=='string'||clave.length<12||clave.length>150||typeof id!=='string'||!id.trim())throw fallo(400,'Revisa el correo, el perfil y la contraseña (12 a 150 caracteres)')
  if(!(await perfil({rol,perfil:id})))throw fallo(404,'Primero registra el perfil académico en el directorio')
  const sal=crypto.randomBytes(16).toString('hex')
  const hash=await derivar(clave,sal,64)
  return Usuario.create({correo,rol,perfil:id,clave:sal+'.'+hash.toString('hex')})
}
async function verificar(clave,guardada){
  const [sal,hash]=guardada.split('.')
  return crypto.timingSafeEqual(await derivar(clave,sal,64),Buffer.from(hash,'hex'))
}
module.exports={crear,perfil,verificar,fallo}
