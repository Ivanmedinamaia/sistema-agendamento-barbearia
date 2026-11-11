// Importa o framework Express
const express = require('express');

// Cria um roteador para as rotas de serviços
const router = express.Router();

// Importa as funções responsaveis pelas operaçoes dos serviços
const servicoController = require('../controllers/servicoController');

// Importa o middleware de autenticação
const autenticarUsuario = require('../middlewares/authMiddleware');

// Importa o middleware de autorização de administrador
const autorizarAdmin = require('../middlewares/autorizarAdmin');

// Rota para cadastrar um novo serviço
router.post(
    '/',
    autenticarUsuario,
    autorizarAdmin,
    servicoController.cadastrarServico
);

// Rota para listar todos os serviços
router.get(
    '/',
    servicoController.listarServicos
);

// Rota para buscar um serviço pelo ID
router.get(
    '/:id',
    servicoController.buscarServicoPorId
);

// Rota para atualizar um serviço existente
router.put(
    '/:id',
    autenticarUsuario,
    autorizarAdmin,
    servicoController.atualizarServico
);

// Rota para excluir um serviço
router.delete(
    '/:id',
    autenticarUsuario,
    autorizarAdmin,
    servicoController.excluirServico
);


// Exportaro roteador para utilização na aplicação
module.exports = router;