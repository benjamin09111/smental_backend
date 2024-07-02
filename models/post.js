const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    titulo: { type: String, required: true },
    descripcion: { type: String, required: true },
    tematica: { type: String, required: true },
    fecha: { type: String, required: true },
    imagen: { type: String },
    autor: { type: String, required: true },
}, {
    timestamps: true
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
