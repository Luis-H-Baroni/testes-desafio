const mongoose = require('mongoose')




const UsuarioSchema = new mongoose.Schema({
    nome: {type:String, required:true, trim:true},
    email: {type:String, required:true, trim:true},
    createdAt: {type:Date, default: Date.now()},
    updatedAt: {type:Date, default: Date.now()}
}
)




module.exports = mongoose.model('Usuario', UsuarioSchema)