// Script que transforma um usuário já cadastrado em administrador.
// Uso (dentro da pasta server):
//   npm run promover-admin -- email@exemplo.com

const path = require('path');

// Carrega as variáveis do arquivo .env da pasta server
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Usuario = require('../src/models/Usuario');

const promoverAdmin = async () => {

    // Obtém o email informado na linha de comando
    const email = (process.argv[2] || '').trim().toLowerCase();

    if (!email) {
        console.error('Informe o email do usuário: npm run promover-admin -- email@exemplo.com');
        process.exitCode = 1;
        return;
    }

    if (!process.env.MONGODB_URI) {
        console.error('A variável MONGODB_URI não está configurada no arquivo .env.');
        process.exitCode = 1;
        return;
    }

    await mongoose.connect(process.env.MONGODB_URI);

    try {
        // Atualiza o tipo do usuário para administrador
        const usuario = await Usuario.findOneAndUpdate(
            { email },
            { tipo: 'admin' },
            { returnDocument: 'after' }
        );

        if (!usuario) {
            console.error(`Nenhum usuário encontrado com o email ${email}. Cadastre-o primeiro pela API.`);
            process.exitCode = 1;
            return;
        }

        console.log(`${usuario.nome} (${usuario.email}) agora é administrador.`);
        console.log('Faça login novamente para receber um token com a nova permissão.');

    } finally {
        await mongoose.disconnect();
    }
};

promoverAdmin().catch(erro => {
    console.error('Erro ao promover usuário:', erro.message);
    process.exitCode = 1;
});
