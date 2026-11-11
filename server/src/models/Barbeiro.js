// Importa o mongoose
const mongoose = require('mongoose');

// Define a estrutura dos barbeiros
const barbeiroSchema = new mongoose.Schema({
    // Nome do profissional
    nome: {
        type: String,
        required: true,
        trim: true,
        minlength: 3
    },

    // Especialidade do profissional
    especialidade: {
        type: String,
        required: true,
        trim: true,
        minlength: 3

    },

    // Telefone de contato do profissional
    telefone: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 15
    },

    // Email de contato do profissional
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true
    },

    // Indica se o barbeiro está disponível para agendamentos
    ativo: {
        type: Boolean,
        default: true
    }


    }, {
        // Registra automaticamente a criação e a atualização
        timestamps: true

});

// Cria o Model de Barbeiro
const Barbeiro  = mongoose.model('Barbeiro', barbeiroSchema);

// Exporta o Model
module.exports = Barbeiro;