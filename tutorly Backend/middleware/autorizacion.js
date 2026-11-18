const crypto=require('node:crypto')
const Usuario=require('../models/usuario')
const Sesion=require('../models/sesion')
const {perfil}=require('../services/cuentas')
const huella=t=>crypto.createHash('sha256').update(t).digest('hex')
const ruta=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next)
const autenticar=ruta(async(req,res,next)=>{
  const token=(req.headers.cookie||'').match(/(?:^|;\s*)tutorly=([a-f0-9]{64})(?:;|$)/)?.[1]
  const s=token && await Sesion.findOne({huella:huella(token),vence:{$gt:new Date()}})
  const u=s && await Usuario.findOne({_id:s.usuario,activo:true,versionSesion:s.version})
  const p=u && await perfil(u)
  if(!p||p.estado!=='Activo')return res.status(401).json({success:false,mensaje:'Inicia sesión con una cuenta activa'})
  req.cuenta=u;req.perfil=p;req.sesion=s;next()
})
const permitir=(...roles)=>(req,res,next)=>roles.includes(req.cuenta.rol)?next():res.status(403).json({success:false,mensaje:'Tu rol no tiene permiso para esta acción'})
module.exports={huella,ruta,autenticar,permitir}
