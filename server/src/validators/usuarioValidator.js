// Importa a biblioteca Joi
const Joi = require('joi');

// Define as regras de validação do cadastro
const cadastroSchema = Joi.object({

    // O nome é obrigatório e deve conter pelo menos 3 caracters
    nome: Joi.string()
        .trim()
        .min(3)
        .required()
        .messages({
            'string.empty': 'O nome é obrigatório.',
            'string.min': 'O nome deve ter pelo menos 3 caracteres.',
            'any.required': 'O nome é obrigatório.'
        }),

    // O Email é obrigatório e deve possuir formato válido
    email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .required()
    .messages({
        'string.email': 'Informe um email válido',
        'string.empty': 'O email é obrigatório.',
        'any.required': 'O email é obrigatório.'
    }),

    // A senha é obrigatória e deve possuir pelo menos 8 caracteres
    senha: Joi.string()
    .min(8)
    .required()
    .messages({
        'string.min': 'A senha deve ter pelo menos 8 caracteres.',
        'string.empty': 'A senha é obrigatória.',
        'any.required': 'A senha é obrigatória.'
    })
}).unknown(false);

// Define as regras de validação do login
const loginSchema = Joi.object({

    // Email utilizado para identificação
    email: Joi.string()
        .email()
        .trim()
        .lowercase()
        .required()
        .messages({
            'string.email': 'Informe um email válido',
            'string.empty': 'O email é obrigatório.',
            'any.required': 'O email é obrigatorio.'
        }),

        // Senha informada pelo usuário
        senha: Joi.string()
            .min(8)
            .required()
            .messages({
                'string.empty': 'A senha é obrigatória.',
                'any.required': 'A senha é obrigatória.'
            })
}).unknown(false);

// Define as regras do pedido de recuperação de senha
const esqueciSenhaSchema = Joi.object({
    email: Joi.string()
        .email()
        .trim()
        .lowercase()
        .required()
        .messages({
            'string.email': 'Informe um email válido',
            'string.empty': 'O email é obrigatório.',
            'any.required': 'O email é obrigatório.'
        })
}).unknown(false);

// Define as regras para criar a nova senha a partir do link recebido
const redefinirSenhaSchema = Joi.object({
    token: Joi.string()
        .hex()
        .length(64)
        .required()
        .messages({
            'string.hex': 'Link de recuperação inválido.',
            'string.length': 'Link de recuperação inválido.',
            'string.empty': 'Link de recuperação inválido.',
            'any.required': 'Link de recuperação inválido.'
        }),

    senha: Joi.string()
        .min(8)
        .required()
        .messages({
            'string.min': 'A senha deve ter pelo menos 8 caracteres.',
            'string.empty': 'A senha é obrigatória.',
            'any.required': 'A senha é obrigatória.'
        })
}).unknown(false);

// Exporta o Schema para utiulização no Controller
module.exports = {
    cadastroSchema,
    loginSchema,
    esqueciSenhaSchema,
    redefinirSenhaSchema
};