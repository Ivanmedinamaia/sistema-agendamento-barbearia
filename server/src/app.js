// Importa o Helmet para adicionar cabeçalhos de segurança HTTP
const helmet = require('helmet');

// Importa o CORS para controlar as origens autorizadas
const cors = require('cors');

// Importa o framework Express
const express = require('express');

// Importa as rotas relacionadas aos usuários
const usuarioRoutes = require('./routes/usuarioRoutes');

// Importa as rotas relacionadas aos serviços
const servicoRoutes = require('./routes/servicoRoutes');

// Importa as rotas responsáveis pelo gerenciamento dos barbeiros
const barbeirosRoutes = require('./routes/barbeirosRoutes');

// Importa as rotas de agendamento
const agendamentoRoutes = require('./routes/agendamentoRoutes');

// Importa o middleware global de tratamento de erros
const errorMiddleware = require('./middlewares/errorMiddleware');


// Cria a aplicação Express
const app = express();

// Informa ao Express quantos proxies existem na frente da API
// (ex.: TRUST_PROXY=1 no Render ou Railway). Sem isso, atrás de um proxy,
// o rate limit enxergaria todos os clientes com o mesmo IP.
if (process.env.TRUST_PROXY) {
    const proxies = Number(process.env.TRUST_PROXY);
    app.set('trust proxy', Number.isNaN(proxies) ? process.env.TRUST_PROXY : proxies);
}

// configura os cabeçalhos HTTP de segurança
app.use(helmet());

// Configura as origins autorizadas a acessar a API
app.use(cors({
    origin: process.env.FRONTEND_URL || false
}));

// Middleware para interpretar requisições JSON
app.use(express.json({ limit: '10kb'}));

// Registra as rotas de usuarios
app.use('/api/usuarios', usuarioRoutes);

// Registra as rotas de serviços
app.use('/api/servicos', servicoRoutes);

// Registra as rotas dos barbeiros no endereço /api/barbeiros
app.use('/api/barbeiros', barbeirosRoutes);

// Registra as rotas de agendamento
app.use('/api/agendamentos', agendamentoRoutes);

// Rota inicial
app.get('/', (req, res) => {
    res.send('Sistema de agendamento para Barbearia');
});


// Rota de status da API
app.get('/api/status', (req, res) => {
    res.json({
        sistema: 'Sistema de agendamento para Barbearia',
        status: 'online',
        versao: '1.0.0'
    });
});


// Trata requisições para rotas inexistentes
app.use((req, res) => {
    res.status(404).json({
        mensagem: 'Rota não encontrada.'
    });
});

// Trata erros internos da aplicação
app.use(errorMiddleware);

// Exporta a aplicação para que outros arquivos possam utilizá-la
module.exports = app;