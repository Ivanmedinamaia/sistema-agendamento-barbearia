const Joi = require('joi');

// Define as regras de validação para a criação de agendamentos
const cadastroAgendamentoSchema = Joi.object({

    // ID do serviço escolhido pelo cliente
    servico: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            'string.empty': 'O serviço deve ser informado.',
            'string.hex': 'O ID do serviço é inválido.',
            'string.length': 'O ID do serviço deve possuir 24 caracteres.',
            'any.required': 'O serviço é obrigatório.'
        }),

    // ID do barbeiro escolhido pelo cliente
    barbeiro: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            'string.empty': 'O barbeiro deve ser informado.',
            'string.hex': 'O ID do barbeiro é inválido.',
            'string.length': 'O ID do barbeiro deve possuir 24 caracteres.',
            'any.required': 'O barbeiro é obrigatório.'
        }),

    // Data e horaório desejados para o atendimento
    dataHora: Joi.date()
        .iso()
        .required()
        .messages({
            'date.base': 'Informe uma data e horário válidos.',
            'date.format': 'A data deve estar no formato ISO 8601.',
            'any.required': 'A data e o horário são obrigatórios.'
        })

}).unknown(false);

// Exporta o Schema de validação

module.exports = {
    cadastroAgendamentoSchema
};