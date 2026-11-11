const express = require('express');
const router = express.Router();

// Importa as funções do controller
const agendamentoController = require('../controllers/agendamentoController');

// Importa o middleware de autenticação
const autenticarUsuario = require('../middlewares/authMiddleware');

// Cadastrar um novo agendamento (somente usuário autenticados)
router.post(
    '/',
    autenticarUsuario,
    agendamentoController.cadastrarAgendamento
);

// Lista os agendamentos do usuário ou todos, se for adminstrador
router.get(
    '/',
    autenticarUsuario,
    agendamentoController.listarAgendamentos
)

// Consulta os horários disponíveis para um barbeiro em determinada data
router.get(
    '/disponibilidade',
    autenticarUsuario,
    agendamentoController.consultarDisponibilidade
);

// Busca um agendamento pelo ID
router.get(
    '/:id', 
    autenticarUsuario,
    agendamentoController.buscarAgendamentoPorId
);

// Cancelar um agendamento
router.patch(
    '/:id/cancelar',
    autenticarUsuario,
    agendamentoController.cancelarAgendamento
);

// Atualiza um agendamento existente
router.patch(
    '/:id',
    autenticarUsuario,
    agendamentoController.atualizarAgendamento
);

module.exports = router;