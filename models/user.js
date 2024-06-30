const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    apellido_2: { type: String, required: true },
    universidad: { type: String, required: true },
    descripcion: { type: String },
    sexo: { type: String, enum: ['M', 'F'], required: true },
    edad: { type: Number, required: true },
    telefono: { type: String, required: true },
    region: { type: String, required: true },
    ciudad: { type: String, required: true },
    comuna: { type: String, required: true },
    pais: { type: String, required: true },
    metodo: { type: String, required: true }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;
