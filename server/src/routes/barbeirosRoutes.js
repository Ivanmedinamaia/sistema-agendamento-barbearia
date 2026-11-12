const express = require('express');
const router = express.Router();

// Importa as funções do controller
const barbeiroController = require('../controllers/barbeiroController');

// Importa os middlewares de autenticação e autorização
const autenticarUsuario = require('../middlewares/authMiddleware');
const autorizarAdmin = require('../middlewares/autorizarAdmin');
const autenticacaoOpcional = require('../middlewares/autenticacaoOpcional');

// Cadastra um barbeiro (somente administrador)
router.post('/', autenticarUsuario, autorizarAdmin, barbeiroController.cadastrarBarbeiro);

// Lista todos os barbeiros (email e telefone só aparecem para administradores)
router.get('/', autenticacaoOpcional, barbeiroController.listarBarbeiros);

// Buscar um barbeiro pelo ID (email e telefone só aparecem para administradores)
router.get('/:id', autenticacaoOpcional, barbeiroController.buscarBarbeiroPorId);

// Atualizar um barbeiro(somente administrador)
router.put('/:id', autenticarUsuario, autorizarAdmin, barbeiroController.atualizarBarbeiro);

// Desativar um barbeiro (somente administrador)
router.patch('/:id/desativar', autenticarUsuario, autorizarAdmin, barbeiroController.desativarBarbeiro);

module.exports = router;