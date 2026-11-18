const mongoose = require('mongoose')
const schema = new mongoose.Schema({
  correo: {type:String,required:true,unique:true,lowercase:true,trim:true},
  clave: {type:String,required:true,select:false},
  rol: {type:String,enum:['ESTUDIANTE','ASESOR','ADMINISTRADOR'],required:true},
  perfil: {type:String,required:true},
  activo: {type:Boolean,default:true},
  versionSesion: {type:Number,default:0}
},{versionKey:false})
schema.index({rol:1,perfil:1},{unique:true})
module.exports=mongoose.model('Usuario',schema,'usuarios')
