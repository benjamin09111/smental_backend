const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    fecha: { type: Date, default: Date.now, required: true },
    autor_id: { type: Number, required: true },
    publicacion_id: { type: Number, required: true }
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;