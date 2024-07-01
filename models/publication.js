const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    descripcion: { type: String, required: true },
    tematica: { type: String, required: true },
    usuarioId: { type: String, required: true }, // Referencia al ID del usuario
    imagen: { type: String }, // Opcional: si quieres incluir una imagen
    nombre: { type: String, required: true } // Nombre del autor
}, {
    timestamps: true // Añade automáticamente createdAt y updatedAt
});

const Publication = mongoose.model('Publication', publicationSchema);

module.exports = Publication;
