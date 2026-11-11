// Importa o Mongoose
const mongoose = require('mongoose');

// Define a estrutura dos usuários
const usuarioSchema = new mongoose.Schema({
    // Nome completo do usuário
    nome:{
        type: String,
        required: true,
        trim: true
    },

    // Email utilizado para identificação e login
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    // Senha do usuário
    senha:{
        type: String,
        required: true,
        minlength: 8,
        select: false
    },
    // Define o nível de acesso do usuário
    tipo: {
        type: String,
        enum: ['admin', 'usuario'],
        default: 'usuario'
    }
}, {
    // Registra automaticamente a data de criação e atualização
    timestamps: true
});

// Cria e exoporta o Model Usuário
const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;