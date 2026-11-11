// Importa o Joi para validar os dados
const Joi = require('joi');

// Define as regras de validação para o cadastro de barbeiros
const cadastroBarbeiroSchema = Joi.object({

    // Nome do profissional
    nome: Joi.string()
        .trim()
        .min(3)
        .required()
        .messages({
            'string.empty': 'O nome do barbeiro é obrigatório.',
            'string.min': 'O nome deve ter pelo menos 3 caracteres.',
            'any.required': 'O nome do barbeiro é obrigatório.'
        }),

    // Especialidade do profissional
    especialidade: Joi.string()
        .trim()
        .min(3)
        .required()
        .messages({
            'string.empty': 'A especialidade é obrigatória.',
            'string.min': 'A especialidade deve ter pelo menos 3 caracteres.',
            'any.required': 'A especialidade é obrigatória.'
        }),

    // Telefone de contato do profissional
    telefone: Joi.string()
        .trim()
        .min(10)
        .max(15)
        .required()
        .messages({
            'string.empty': 'O telefone é obrigatório.',
            'string.min': 'O telefone deve ter pelo menos 10 caracteres.',
            'string.max': 'O telefone deve ter no máximo 15 caracteres.',
            'any.required': 'O telefone é obrigatório.'

        }),

    // Email de contato do profissional
    email: Joi.string()
        .email()
        .trim()
        .lowercase()
        .required()
        .messages({
            'string.email': 'Informe um e-mail válido.',
            'string.empty': 'O e-mail é obrigatório.',
            'any.required': 'O e-mail é obrigatório.'            
        }),


}).unknown(false);

// Define as regras de validação para atualização parcial de barbeiros
const atualizarBarbeiroSchema = cadastroBarbeiroSchema.fork(
    ['nome', 'especialidade', 'telefone', 'email'],
    (campo) => campo.optional()
).min(1);

module.exports = {
    cadastroBarbeiroSchema,
    atualizarBarbeiroSchema
};