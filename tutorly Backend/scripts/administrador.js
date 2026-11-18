const mongoose=require('mongoose')
const crypto=require('node:crypto')
const {crear}=require('../services/cuentas')
require('../config/env').loadEnv()
async function main(){
 const correo=process.argv[2]
 if(!correo)throw Error('Uso: npm run admin -- correo@universidad.edu')
 await require('../config/database').connectDatabase()
 const clave=crypto.randomBytes(18).toString('base64url')
 await crear(correo,'ADMINISTRADOR','principal',clave)
 console.log('Primer acceso. Guarda la contraseña en un lugar privado:',clave)
}
main().catch(e=>{console.error(e.code===11000?'Ya existe el administrador o el correo.':e.message);process.exitCode=1}).finally(()=>mongoose.disconnect())
