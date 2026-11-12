// Ambiente de desenvolvimento: garante que exista um MongoDB local e inicia a API,
// que reinicia sozinha a cada alteração no código.
// Uso (dentro da pasta server): npm run dev
//
// Se o MONGODB_URI do .env apontar para um MongoDB local (localhost) que não está
// rodando, este script sobe um automaticamente na mesma porta. Os dados ficam
// guardados em ~/.barbearia-agendamento/mongodb e continuam lá entre as execuções.
// Se o MongoDB já estiver rodando, ou se o .env apontar para outro servidor
// (como o MongoDB Atlas), o script apenas inicia a API.

const path = require('path');
const os = require('os');
const fs = require('fs');
const net = require('net');
const { spawn } = require('child_process');

const PASTA_SERVER = path.join(__dirname, '..');
const PASTA_DADOS = path.join(os.homedir(), '.barbearia-agendamento', 'mongodb');

require('dotenv').config({ path: path.join(PASTA_SERVER, '.env'), quiet: true });

// Verifica se já existe algum programa escutando na porta
const portaEmUso = (porta) =>
    new Promise((resolve) => {
        const conexao = net.connect({ host: '127.0.0.1', port: porta });
        conexao.setTimeout(1000);
        conexao.once('connect', () => {
            conexao.destroy();
            resolve(true);
        });
        conexao.once('timeout', () => {
            conexao.destroy();
            resolve(false);
        });
        conexao.once('error', () => resolve(false));
    });

// Pede ao MongoDB para gravar tudo em disco. No Windows o MongoDB é encerrado
// de forma abrupta, então isso evita perder alterações feitas logo antes de fechar.
async function salvarDados(uri) {
    const mongoose = require('mongoose');
    const conexao = mongoose.createConnection(uri, { serverSelectionTimeoutMS: 2000 });

    try {
        await conexao.asPromise();
        await conexao.db.admin().command({ fsync: 1 });
    } catch {
        // O MongoDB já pode ter sido encerrado pelo próprio Ctrl+C
    } finally {
        await conexao.close().catch(() => {});
    }
}

// Sobe o MongoDB local, se o .env apontar para um que não está rodando
async function garantirMongoLocal() {
    const uri = process.env.MONGODB_URI || '';
    const local = uri.match(/^mongodb:\/\/(?:([^@/]*)@)?(?:localhost|127\.0\.0\.1)(?::(\d+))?(?:[/?]|$)/);

    if (!local) {
        return null;
    }

    const [, credenciais, portaTexto] = local;
    const porta = Number(portaTexto || 27017);

    if (await portaEmUso(porta)) {
        console.log(`MongoDB já está rodando na porta ${porta}.`);
        return null;
    }

    if (credenciais) {
        console.warn(
            'O MONGODB_URI tem usuário e senha, então o MongoDB local não será iniciado automaticamente. ' +
            'Inicie o seu MongoDB antes de rodar a API.'
        );
        return null;
    }

    const { MongoMemoryServer } = require('mongodb-memory-server-core');

    fs.mkdirSync(PASTA_DADOS, { recursive: true });
    console.log(`Iniciando MongoDB local na porta ${porta} (dados em ${PASTA_DADOS})...`);
    console.log('Na primeira vez o MongoDB é baixado (cerca de 70 MB) e isso pode levar alguns minutos.');

    const mongod = await MongoMemoryServer.create({
        instance: {
            port: porta,
            portGeneration: false,
            dbPath: PASTA_DADOS,
            storageEngine: 'wiredTiger'
        }
    });

    console.log('MongoDB local pronto.');
    return mongod;
}

async function iniciar() {
    const mongod = await garantirMongoLocal();

    // Inicia a API em um processo separado, reiniciando a cada alteração
    const api = spawn(process.execPath, ['--watch', 'index.js'], {
        cwd: PASTA_SERVER,
        stdio: 'inherit'
    });

    let encerrando = false;

    // Encerra a API e o MongoDB, mantendo os dados salvos
    const encerrar = async (codigo = 0) => {
        if (encerrando) return;
        encerrando = true;

        api.kill();

        if (mongod) {
            await salvarDados(mongod.getUri());
            await mongod.stop({ doCleanup: false }).catch(() => {});
        }

        process.exit(codigo);
    };

    api.on('exit', (codigo) => encerrar(codigo ?? 0));
    process.on('SIGINT', () => encerrar(0));
    process.on('SIGTERM', () => encerrar(0));
}

iniciar().catch((erro) => {
    console.error('Erro ao iniciar o ambiente de desenvolvimento:', erro.message);
    process.exit(1);
});
