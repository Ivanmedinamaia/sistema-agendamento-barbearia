// Importa o limitador de requisições
const { rateLimit } = require('express-rate-limit');

// Importa o Express
const express = require('express');

// Cria um roteador
const router = express.Router();

// Importa o Controller de usuários
const usuarioController = require('../controllers/usuarioController');


// Limita tentativas de login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        mensagem: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
    }
});

// Limita tentativas de cadastro
const cadastroLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        mensagem: 'Muitas tentativas de cadastro. Tente novamente em 15 minutos.'
    }
});


// Define a rota de cadastro de usuários
router.post('/', cadastroLimiter, usuarioController.cadastrarUsuario);

// Define a rota de login de usuários
router.post('/login', loginLimiter, usuarioController.loginUsuario);

// Exporta as rotas
module.exports = router;