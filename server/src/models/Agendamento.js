// Importa o mongoose
const mongoose = require('mongoose');

// Define a estrutura dos agendamentos
const agendamentoSchema = new mongoose.Schema({
    // Identifica o usuário responsável pelo agendamento
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },

    servico: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Servico',
        required: true
    },

    // Identifica o barbeiro responsável pelo atendimento
    barbeiro: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Barbeiro',
        required: true
    },

    // Registra a data e o harário do atendimento

    dataHora: {
        type: Date,
        required: true
    },

    // Indica a situação atual do agendamento
    status: {
        type: String,
        enum: ['agendado', 'concluido', 'cancelado'],
        default: 'agendado'
    }
    
    

    },   {    
        // Registra automaticamente a criação e a atualização
        timestamps: true   
    });

    
    // Índice para otimizar a busca de conflitos por barbeiro,
    // status e horário do agendamento
    agendamentoSchema.index({
        barbeiro: 1,
        status: 1,
        dataHora: 1
    });

    // Índice para otimizar a listagem de agendamentos por usuário e data
    agendamentoSchema.index({
        usuario: 1,
        dataHora: 1
    });


    // Cria o Model de Agendamento
    const Agendamento = mongoose.model('Agendamento', agendamentoSchema);

    // Exporta o Model
    module.exports = Agendamento