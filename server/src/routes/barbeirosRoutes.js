const express = require('express');
const router = express.Router();

// Importa as funções do controller
const barbeiroController = require('../controllers/barbeiroController');

// Importa os middlewares de autenticação e autorização
const autenticarUsuario = require('../middlewares/authMiddleware');
const autorizarAdmin = require('../middlewares/autorizarAdmin');

// Cadastra um barbeiro (somente administrador)
router.post('/', autenticarUsuario, autorizarAdmin, barbeiroController.cadastrarBarbeiro);

// Lista todos os barbeiros
router.get('/', barbeiroController.listarBarbeiros);

// Buscar um barbeiro pelo ID
router.get('/:id', barbeiroController.buscarBarbeiroPorId);

// Atualizar um barbeiro(somente administrador)
router.put('/:id', autenticarUsuario, autorizarAdmin, barbeiroController.atualizarBarbeiro);

// Desativar um barbeiro (somente administrador)
router.patch('/:id/desativar', autenticarUsuario, autorizarAdmin, barbeiroController.desativarBarbeiro);

module.exports = router;