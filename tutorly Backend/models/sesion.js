const mongoose=require('mongoose')
module.exports=mongoose.model('Sesion',new mongoose.Schema({
  huella:{type:String,unique:true,required:true},
  usuario:{type:mongoose.Schema.Types.ObjectId,required:true},
  version:Number,
  vence:{type:Date,required:true,expires:0}
}),'sesiones')
