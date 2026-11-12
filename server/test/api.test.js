// Testes de integração da API: requisições HTTP reais contra um MongoDB em memória.
// Execute com: npm test
// Na primeira execução, o MongoDB de teste é baixado (cerca de 70 MB) para ~/.cache/mongodb-binaries.

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { MongoMemoryServer } = require('mongodb-memory-server-core');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

let mongod;
let servidor;
let URL_BASE;
let Usuario;
let Agendamento;

// Usuários e tokens usados nos testes
const ADMIN = { nome: 'Admin Teste', email: 'admin@exemplo.com', senha: 'senha-admin-123' };
const CLIENTE = { nome: 'Cliente Teste', email: 'cliente@exemplo.com', senha: 'senha-cliente-123' };
let tokenAdmin;
let tokenCliente;
let tokenOutroCliente;

// IDs criados ao longo dos testes
let servico30;
let servicoLongo;
let barbeiro;

// Faz uma requisição à API de teste e devolve o status e o corpo JSON
async function requisicao(metodo, caminho, { corpo, token, corpoBruto } = {}) {
    const resposta = await fetch(URL_BASE + caminho, {
        method: metodo,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: corpoBruto ?? (corpo ? JSON.stringify(corpo) : undefined)
    });

    return { status: resposta.status, corpo: await resposta.json().catch(() => null) };
}

// Gera um token sem passar pelo login, que tem limite de tentativas
const tokenPara = (usuario) =>
    jwt.sign({ id: usuario._id, tipo: usuario.tipo }, process.env.JWT_SECRET, {
        expiresIn: '1h',
        algorithm: 'HS256'
    });

// Próximo dia com o dia da semana pedido (0 = domingo), a pelo menos 2 dias de hoje
function proximoDia(condicao) {
    const data = new Date(Date.now() + 2 * 86400000);
    while (!condicao(data.getUTCDay())) {
        data.setUTCDate(data.getUTCDate() + 1);
    }
    return data.toISOString().slice(0, 10);
}

// Dia de funcionamento usado nos testes de agendamento
const DIA = proximoDia((dia) => dia !== 0);
const DOMINGO = proximoDia((dia) => dia === 0);

// Converte "HH:MM" do dia de teste para ISO, no fuso de Boa Vista (UTC-4)
const as = (hora, dia = DIA) => new Date(`${dia}T${hora}:00-04:00`).toISOString();

// Agenda um horário no dia de teste com o serviço de 30 minutos
const agendar = (hora, token = tokenCliente, servico = servico30) =>
    requisicao('POST', '/agendamentos', {
        token,
        corpo: { servico, barbeiro, dataHora: as(hora) }
    });

before(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('barbearia-teste');
    process.env.JWT_SECRET = 'segredo-usado-somente-nos-testes';

    // A aplicação só é carregada depois que as variáveis de ambiente existem
    const app = require('../src/app');
    Usuario = require('../src/models/Usuario');
    Agendamento = require('../src/models/Agendamento');

    await mongoose.connect(process.env.MONGODB_URI);
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));

    servidor = app.listen(0);
    await once(servidor, 'listening');
    URL_BASE = `http://127.0.0.1:${servidor.address().port}/api`;

    // O administrador é criado direto no banco, como faz o script promover-admin
    const admin = await Usuario.create({
        nome: ADMIN.nome,
        email: ADMIN.email,
        senha: await bcrypt.hash(ADMIN.senha, 4),
        tipo: 'admin'
    });
    tokenAdmin = tokenPara(admin);

    const outroCliente = await Usuario.create({
        nome: 'Outro Cliente',
        email: 'outro@exemplo.com',
        senha: await bcrypt.hash('senha-outro-123', 4)
    });
    tokenOutroCliente = tokenPara(outroCliente);
});

after(async () => {
    servidor?.closeAllConnections();
    servidor?.close();
    await mongoose.disconnect();
    await mongod?.stop();
});

describe('Erros gerais', () => {
    it('responde 400 para JSON malformado', async () => {
        const r = await requisicao('POST', '/usuarios/login', { corpoBruto: '{invalido' });
        assert.equal(r.status, 400);
        assert.match(r.corpo.mensagem, /JSON inválido/);
    });

    it('responde 413 para corpo maior que 10kb', async () => {
        const r = await requisicao('POST', '/usuarios', {
            corpoBruto: JSON.stringify({ nome: 'x'.repeat(20000) })
        });
        assert.equal(r.status, 413);
    });

    it('responde 404 para rota inexistente', async () => {
        const r = await requisicao('GET', '/nao-existe');
        assert.equal(r.status, 404);
    });

    it('informa que a API está online', async () => {
        const r = await requisicao('GET', '/status');
        assert.equal(r.status, 200);
        assert.equal(r.corpo.status, 'online');
    });
});

describe('Usuários', () => {
    it('cadastra um usuário sem expor a senha', async () => {
        const r = await requisicao('POST', '/usuarios', { corpo: CLIENTE });
        assert.equal(r.status, 201);
        assert.equal(r.corpo.usuario.email, CLIENTE.email);
        assert.equal(r.corpo.usuario.tipo, 'usuario');
        assert.equal(r.corpo.usuario.senha, undefined);
    });

    it('recusa cadastro com dados inválidos', async () => {
        const r = await requisicao('POST', '/usuarios', {
            corpo: { nome: 'Fulano', email: 'email-invalido', senha: 'senha-123456' }
        });
        assert.equal(r.status, 400);
    });

    it('aceita só um cadastro quando o mesmo email chega ao mesmo tempo', async () => {
        const respostas = await Promise.all(
            Array.from({ length: 5 }, () =>
                requisicao('POST', '/usuarios', {
                    corpo: { nome: 'Repetido', email: 'repetido@exemplo.com', senha: 'senha-123456' }
                })
            )
        );
        const status = respostas.map((r) => r.status);

        assert.equal(status.filter((s) => s === 201).length, 1, status.join(','));
        assert.ok(status.every((s) => s === 201 || s === 409), status.join(','));
    });

    it('faz login e devolve um token válido', async () => {
        const r = await requisicao('POST', '/usuarios/login', {
            corpo: { email: CLIENTE.email, senha: CLIENTE.senha }
        });
        assert.equal(r.status, 200);
        assert.equal(r.corpo.usuario.tipo, 'usuario');

        tokenCliente = r.corpo.token;
        assert.ok(jwt.verify(tokenCliente, process.env.JWT_SECRET));
    });

    it('responde da mesma forma para senha errada e email inexistente', async () => {
        const senhaErrada = await requisicao('POST', '/usuarios/login', {
            corpo: { email: CLIENTE.email, senha: 'senha-errada-000' }
        });
        const emailInexistente = await requisicao('POST', '/usuarios/login', {
            corpo: { email: 'ninguem@exemplo.com', senha: 'senha-errada-000' }
        });

        assert.equal(senhaErrada.status, 401);
        assert.equal(emailInexistente.status, 401);
        assert.equal(senhaErrada.corpo.mensagem, emailInexistente.corpo.mensagem);
    });

    it('bloqueia o login depois de muitas tentativas', async () => {
        let ultima;
        for (let i = 0; i < 6; i++) {
            ultima = await requisicao('POST', '/usuarios/login', {
                corpo: { email: CLIENTE.email, senha: 'senha-errada-000' }
            });
        }
        assert.equal(ultima.status, 429);
    });
});

describe('Autenticação e permissões', () => {
    it('exige token nas rotas protegidas', async () => {
        const r = await requisicao('GET', '/agendamentos');
        assert.equal(r.status, 401);
    });

    it('recusa token inválido', async () => {
        const r = await requisicao('GET', '/agendamentos', { token: 'token-invalido' });
        assert.equal(r.status, 401);
    });

    it('impede cliente de usar rotas de administrador', async () => {
        const r = await requisicao('POST', '/servicos', {
            token: tokenCliente,
            corpo: { nome: 'Corte', descricao: 'Corte simples', preco: 30, duracaoMinutos: 30 }
        });
        assert.equal(r.status, 403);
    });
});

describe('Serviços', () => {
    it('administrador cadastra serviços', async () => {
        const curto = await requisicao('POST', '/servicos', {
            token: tokenAdmin,
            corpo: { nome: 'Corte', descricao: 'Corte simples', preco: 30, duracaoMinutos: 30 }
        });
        const longo = await requisicao('POST', '/servicos', {
            token: tokenAdmin,
            corpo: { nome: 'Pacote completo', descricao: 'Serviço bem longo', preco: 200, duracaoMinutos: 400 }
        });

        assert.equal(curto.status, 201);
        assert.equal(longo.status, 201);
        servico30 = curto.corpo.servico.id;
        servicoLongo = longo.corpo.servico.id;
    });

    it('recusa duração menor que 5 minutos', async () => {
        const r = await requisicao('POST', '/servicos', {
            token: tokenAdmin,
            corpo: { nome: 'Rápido', descricao: 'Serviço rápido', preco: 10, duracaoMinutos: 2 }
        });
        assert.equal(r.status, 400);
    });

    it('lista serviços sem exigir login', async () => {
        const r = await requisicao('GET', '/servicos');
        assert.equal(r.status, 200);
        assert.equal(r.corpo.quantidade, 2);
    });

    it('desativa um serviço e impede alterações depois disso', async () => {
        const temporario = await requisicao('POST', '/servicos', {
            token: tokenAdmin,
            corpo: { nome: 'Temporário', descricao: 'Será desativado', preco: 10, duracaoMinutos: 20 }
        });
        const id = temporario.corpo.servico.id;

        assert.equal((await requisicao('DELETE', `/servicos/${id}`, { token: tokenAdmin })).status, 200);
        assert.equal((await requisicao('GET', `/servicos/${id}`)).status, 404);
        assert.equal(
            (await requisicao('PUT', `/servicos/${id}`, { token: tokenAdmin, corpo: { preco: 99 } })).status,
            404
        );
        assert.equal((await requisicao('DELETE', `/servicos/${id}`, { token: tokenAdmin })).status, 404);
    });
});

describe('Barbeiros', () => {
    const dadosBarbeiro = {
        nome: 'Barbeiro Teste',
        especialidade: 'Cortes clássicos',
        telefone: '95999990000',
        email: 'barbeiro@exemplo.com'
    };

    it('administrador cadastra um barbeiro', async () => {
        const r = await requisicao('POST', '/barbeiros', { token: tokenAdmin, corpo: dadosBarbeiro });
        assert.equal(r.status, 201);
        barbeiro = r.corpo.barbeiro.id;
    });

    it('recusa email de barbeiro repetido', async () => {
        const r = await requisicao('POST', '/barbeiros', {
            token: tokenAdmin,
            corpo: { ...dadosBarbeiro, nome: 'Outro Barbeiro' }
        });
        assert.equal(r.status, 409);
    });

    it('esconde email e telefone de quem não é administrador', async () => {
        const visitante = await requisicao('GET', '/barbeiros');
        const cliente = await requisicao('GET', `/barbeiros/${barbeiro}`, { token: tokenCliente });

        assert.equal(visitante.corpo.barbeiros[0].nome, dadosBarbeiro.nome);
        assert.equal(visitante.corpo.barbeiros[0].email, undefined);
        assert.equal(visitante.corpo.barbeiros[0].telefone, undefined);
        assert.equal(cliente.corpo.barbeiro.email, undefined);
    });

    it('mostra email e telefone para o administrador', async () => {
        const r = await requisicao('GET', '/barbeiros', { token: tokenAdmin });
        assert.equal(r.corpo.barbeiros[0].email, dadosBarbeiro.email);
        assert.equal(r.corpo.barbeiros[0].telefone, dadosBarbeiro.telefone);
    });
});

describe('Agendamentos', () => {
    let idCliente;
    let idCorrida;

    it('cria um agendamento válido', async () => {
        const r = await agendar('08:00');
        assert.equal(r.status, 201, JSON.stringify(r.corpo));
        assert.equal(r.corpo.agendamento.status, 'agendado');
        idCliente = r.corpo.agendamento.id;
    });

    it('recusa horários fora das regras da barbearia', async () => {
        const casos = [
            { dataHora: '2020-01-06T09:00:00-04:00', mensagem: /passados/ },
            { dataHora: as('09:10'), mensagem: /20 minutos/ },
            { dataHora: as('09:00', DOMINGO), mensagem: /domingos/ },
            { dataHora: as('07:40'), mensagem: /08h e 18h/ },
            { dataHora: as('17:40'), mensagem: /08h e 18h/ },
            { dataHora: as('11:40'), mensagem: /12h e 13h/ }
        ];

        for (const caso of casos) {
            const r = await requisicao('POST', '/agendamentos', {
                token: tokenCliente,
                corpo: { servico: servico30, barbeiro, dataHora: caso.dataHora }
            });
            assert.equal(r.status, 400, caso.dataHora);
            assert.match(r.corpo.mensagem, caso.mensagem);
        }
    });

    it('recusa atendimento que passaria da meia-noite', async () => {
        const r = await agendar('17:40', tokenCliente, servicoLongo);
        assert.equal(r.status, 400);
        assert.match(r.corpo.mensagem, /08h e 18h/);
    });

    it('recusa horário que se sobrepõe a outro do mesmo barbeiro', async () => {
        const r = await agendar('08:20');
        assert.equal(r.status, 409);
    });

    it('aceita só uma de 20 reservas simultâneas do mesmo horário', async () => {
        const respostas = await Promise.all(Array.from({ length: 20 }, () => agendar('09:00')));
        const criadas = respostas.filter((r) => r.status === 201);

        assert.equal(criadas.length, 1, respostas.map((r) => r.status).join(','));
        assert.ok(respostas.every((r) => r.status === 201 || r.status === 409));
        idCorrida = criadas[0].corpo.agendamento.id;
    });

    it('aceita só uma de duas reservas simultâneas com sobreposição parcial', async () => {
        const status = (await Promise.all([agendar('10:00'), agendar('10:20')]))
            .map((r) => r.status)
            .sort();
        assert.deepEqual(status, [201, 409]);
    });

    it('o índice do banco bloqueia sobreposição mesmo sem passar pela API', async () => {
        const cliente = await Usuario.findOne({ email: CLIENTE.email });

        await assert.rejects(
            Agendamento.create({
                usuario: cliente._id,
                servico: servico30,
                barbeiro,
                dataHora: new Date(as('09:00')),
                horariosOcupados: [new Date(as('09:00'))]
            }),
            (erro) => erro.code === 11000
        );
    });

    it('cliente só enxerga os próprios agendamentos', async () => {
        const lista = await requisicao('GET', '/agendamentos', { token: tokenOutroCliente });
        const detalhe = await requisicao('GET', `/agendamentos/${idCliente}`, { token: tokenOutroCliente });

        assert.equal(lista.corpo.total, 0);
        assert.equal(detalhe.status, 404);
    });

    it('cliente não remarca nem cancela agendamento de outra pessoa', async () => {
        const remarcar = await requisicao('PATCH', `/agendamentos/${idCliente}`, {
            token: tokenOutroCliente,
            corpo: { servico: servico30, barbeiro, dataHora: as('15:00') }
        });
        const cancelar = await requisicao('PATCH', `/agendamentos/${idCliente}/cancelar`, {
            token: tokenOutroCliente
        });

        assert.equal(remarcar.status, 404);
        assert.equal(cancelar.status, 404);
    });

    it('remarca para o próprio horário, recusa horário ocupado e aceita horário livre', async () => {
        const remarcar = (hora) =>
            requisicao('PATCH', `/agendamentos/${idCliente}`, {
                token: tokenCliente,
                corpo: { servico: servico30, barbeiro, dataHora: as(hora) }
            });

        assert.equal((await remarcar('08:00')).status, 200);
        assert.equal((await remarcar('09:00')).status, 409);

        const livre = await remarcar('14:00');
        assert.equal(livre.status, 200);
        assert.equal(livre.corpo.agendamento.horariosOcupados, undefined);
    });

    it('libera o horário antigo depois da remarcação', async () => {
        const r = await agendar('08:00', tokenOutroCliente);
        assert.equal(r.status, 201);
    });

    it('lista apenas horários livres na disponibilidade', async () => {
        const consulta = (extra = '') =>
            requisicao(
                'GET',
                `/agendamentos/disponibilidade?barbeiro=${barbeiro}&servico=${servico30}&data=${DIA}${extra}`,
                { token: tokenCliente }
            );

        const horarios = (await consulta()).corpo.horariosDisponiveis.map((h) => h.horario);
        assert.ok(!horarios.includes('08:00'));
        assert.ok(!horarios.includes('09:00'));
        assert.ok(!horarios.includes('14:00'));
        assert.ok(horarios.includes('13:00'));
        assert.ok(!horarios.includes('11:40'), 'não deve invadir o almoço');
        assert.ok(!horarios.includes('17:40'), 'não deve passar das 18h');

        // Na remarcação, o horário atual do próprio agendamento aparece como livre
        const comIgnorar = (await consulta(`&ignorar=${idCliente}`)).corpo.horariosDisponiveis.map(
            (h) => h.horario
        );
        assert.ok(comIgnorar.includes('14:00'));

        assert.equal((await consulta('&ignorar=abc')).status, 400);
    });

    it('recusa disponibilidade aos domingos', async () => {
        const r = await requisicao(
            'GET',
            `/agendamentos/disponibilidade?barbeiro=${barbeiro}&servico=${servico30}&data=${DOMINGO}`,
            { token: tokenCliente }
        );
        assert.equal(r.status, 400);
    });

    it('cancela um agendamento e libera o horário', async () => {
        const cancelar = () =>
            requisicao('PATCH', `/agendamentos/${idCliente}/cancelar`, { token: tokenCliente });

        assert.equal((await cancelar()).status, 200);
        assert.equal((await agendar('14:00', tokenOutroCliente)).status, 201);
        assert.equal((await cancelar()).status, 404, 'não cancela duas vezes');
    });

    it('só o administrador conclui, e só depois do início do atendimento', async () => {
        const concluir = (token) =>
            requisicao('PATCH', `/agendamentos/${idCorrida}/concluir`, { token });

        assert.equal((await concluir(tokenCliente)).status, 403);
        assert.equal((await concluir(tokenAdmin)).status, 404, 'atendimento futuro');

        // Simula um atendimento que já começou
        await Agendamento.updateOne({ _id: idCorrida }, { dataHora: new Date(Date.now() - 3600000) });

        const r = await concluir(tokenAdmin);
        assert.equal(r.status, 200);
        assert.equal(r.corpo.agendamento.status, 'concluido');
    });

    it('pagina a listagem e limita o tamanho da página', async () => {
        const pagina = await requisicao('GET', '/agendamentos?pagina=1&limite=2', { token: tokenAdmin });

        assert.equal(pagina.corpo.quantidade, 2);
        assert.ok(pagina.corpo.total > 2);
        assert.equal(pagina.corpo.totalPaginas, Math.ceil(pagina.corpo.total / 2));

        const grande = await requisicao('GET', '/agendamentos?limite=999', { token: tokenAdmin });
        assert.equal(grande.corpo.limite, 100);
    });

    it('filtra a listagem por período e status', async () => {
        const agora = Date.now();

        const proximos = await requisicao('GET', '/agendamentos?periodo=proximos', { token: tokenAdmin });
        assert.ok(proximos.corpo.agendamentos.every((a) => new Date(a.dataHora) >= agora));

        const anteriores = await requisicao('GET', '/agendamentos?periodo=anteriores', { token: tokenAdmin });
        assert.equal(anteriores.corpo.total, 1);
        assert.equal(anteriores.corpo.agendamentos[0].status, 'concluido');

        const cancelados = await requisicao('GET', '/agendamentos?status=cancelado', { token: tokenAdmin });
        assert.ok(cancelados.corpo.total >= 1);
        assert.ok(cancelados.corpo.agendamentos.every((a) => a.status === 'cancelado'));

        assert.equal((await requisicao('GET', '/agendamentos?periodo=xyz', { token: tokenAdmin })).status, 400);
        assert.equal((await requisicao('GET', '/agendamentos?status=xyz', { token: tokenAdmin })).status, 400);
    });
});
