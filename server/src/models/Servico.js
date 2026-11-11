const mongoose = require('mongoose');

// Define a estrutura dos serviços
const servicoSchema = new mongoose.Schema({
    // Nome do serviço oferecido pela barbearia
    nome: {
        type: String,
        required: true,
        trim: true,
        minlength: 3
    },

    // Descrição detalhada do serviço
    descricao: {
        type: String,
        required: true,
        trim: true,
        minlength: 5
    },

    // Preço cobrado pelo serviço
    preco: {
        type: Number,
        required: true,
        min: 0
    },

    // Tempo necessário para realizar o serviço, em minutos
    duracaoMinutos: {
        type: Number,
        required: true,
        min: 5,
        validate: {
            validator: Number.isInteger,
            message: 'A duração deve ser um número inteiro.'
        }
    },

    // Indica se o serviço está disponível para agendamento
    ativo: {
        type: Boolean,
        default: true
    }

    }, {

        // Registra automaticamente a data de criação e atualização
        timestamps: true
    
    });

// Cria o Model Serviço a partir do Schema
const Servico = mongoose.model('Servico', servicoSchema);

// Exporta o Model para utilização em outros arquivos
module.exports = Servico;
