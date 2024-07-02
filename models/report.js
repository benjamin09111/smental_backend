const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    descripcion: { type: String, required: true },
    fecha: { type: Date, default: Date.now, required: true },
    reportador_id: { type: Number, required: true },
    reportado_id: { type: Number, required: true }
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;