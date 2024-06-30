const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    
}, {
    timestamps: true
});

const Publication = mongoose.model('Publication', userSchema);

module.exports = User;
