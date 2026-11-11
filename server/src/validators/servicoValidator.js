// Importa a biblioteca Joi para validação dos dados
const Joi = require('joi');

// Define as regras de validação para o cadastro de serviços
const cadastroServicoSchema = Joi.object({
    // Nome do serviço
    nome: Joi.string()
        .trim()
        .min(3)
        .required()
        .messages({
            'string.empty': 'O nome do serviço é obrigatório.',
            'string.min': 'O nome deve ter pelo menos 3 caracteres.',
            'any.required': 'O nome do serviço é obrigatório.' 
        }),

    // Descrição do serviço
    descricao: Joi.string()
        .trim()
        .min(5)
        .required()
        .messages({
            'string.empty': 'A descrição do serviço é obrigatória.',
            'string.min': 'A descrição deve ter pelo menos 5 caracteres.',
            'any.required': 'A descrição do serviço é obrigatória.'
        }),

    // Preço do serviço
    preco: Joi.number()
        .min(0)
        .required()
        .messages({
            'number.base': 'O preço deve ser um valor numérico.',
            'number.min': 'O preço não pode ser negativo.',
            'any.required': 'O preço do serviço é obrigatório.'
        }),

    // Duração do serviço em minutos
    duracaoMinutos: Joi.number()
        .integer()
        .min(5)
        .required()
        .messages({
            'number.base': 'A duração deve ter um valor numérico.',
            'number.integer': 'A duração deve ser informada em minutos inteiros.',
            'number.min': 'A duração mínima é de 5 minutos.',
            'any.required': 'A duração do serviço é obrigatória.'
        }),


}).unknown(false);

// Define as regras de validação para atualização de serviços
const atualizarServicoSchema = cadastroServicoSchema.fork(
    ['nome', 'descricao', 'preco', 'duracaoMinutos'],
    (campo) => campo.optional()
).min(1);

// Exporta o schema para utilização no controller
module.exports = {
    cadastroServicoSchema,
    atualizarServicoSchema

};