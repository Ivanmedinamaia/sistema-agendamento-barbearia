// Cadastra serviços e barbeiros fictícios para demonstração do sistema.
// Uso (dentro da pasta server, com o banco rodando):
//   npm run popular-demo
//
// Pode ser executado várias vezes: o que já existe não é duplicado.
// Os barbeiros são fictícios; os emails usam o domínio reservado example.com.

const path = require('path');

// Carrega as variáveis do arquivo .env da pasta server
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const mongoose = require('mongoose');
const Servico = require('../src/models/Servico');
const Barbeiro = require('../src/models/Barbeiro');

// Durações em múltiplos de 20 minutos, que é o intervalo da agenda
const SERVICOS = [
    {
        nome: 'Corte de cabelo',
        descricao: 'Corte na tesoura ou máquina, com lavagem e finalização.',
        preco: 40,
        duracaoMinutos: 40
    },
    {
        nome: 'Degradê',
        descricao: 'Fade na máquina com transição suave e acabamento na navalha.',
        preco: 45,
        duracaoMinutos: 40
    },
    {
        nome: 'Barba',
        descricao: 'Barba modelada com toalha quente, navalha e hidratação.',
        preco: 30,
        duracaoMinutos: 20
    },
    {
        nome: 'Corte + barba',
        descricao: 'Combo completo de corte de cabelo e barba.',
        preco: 65,
        duracaoMinutos: 60
    },
    {
        nome: 'Corte infantil',
        descricao: 'Corte para crianças de até 12 anos.',
        preco: 35,
        duracaoMinutos: 40
    },
    {
        nome: 'Acabamento (pezinho)',
        descricao: 'Contorno da nuca, costeletas e laterais.',
        preco: 15,
        duracaoMinutos: 20
    },
    {
        nome: 'Sobrancelha',
        descricao: 'Design de sobrancelha na navalha ou na pinça.',
        preco: 15,
        duracaoMinutos: 20
    },
    {
        nome: 'Pigmentação de barba',
        descricao: 'Preenchimento de falhas e realce do contorno da barba.',
        preco: 40,
        duracaoMinutos: 40
    },
    {
        nome: 'Hidratação capilar',
        descricao: 'Tratamento para cabelo ressecado, com lavagem e massagem.',
        preco: 30,
        duracaoMinutos: 20
    },
    {
        nome: 'Platinado',
        descricao: 'Descoloração completa com matização. Inclui corte.',
        preco: 150,
        duracaoMinutos: 120
    }
];

const BARBEIROS = [
    {
        nome: 'Carlos Mendes',
        especialidade: 'Cortes clássicos e degradê',
        telefone: '95990000001',
        email: 'carlos.mendes@example.com'
    },
    {
        nome: 'Rafael Souza',
        especialidade: 'Barba, navalha e pigmentação',
        telefone: '95990000002',
        email: 'rafael.souza@example.com'
    },
    {
        nome: 'Bruno Lima',
        especialidade: 'Cortes infantis e acabamentos',
        telefone: '95990000003',
        email: 'bruno.lima@example.com'
    },
    {
        nome: 'Diego Martins',
        especialidade: 'Coloração, platinado e cortes modernos',
        telefone: '95990000004',
        email: 'diego.martins@example.com'
    }
];

const popularDemo = async () => {

    if (!process.env.MONGODB_URI) {
        console.error('A variável MONGODB_URI não está configurada no arquivo .env.');
        process.exitCode = 1;
        return;
    }

    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });

    try {
        let servicosCriados = 0;
        let barbeirosCriados = 0;

        // Cria cada serviço que ainda não existe (pelo nome)
        for (const servico of SERVICOS) {
            const existente = await Servico.findOne({ nome: servico.nome });

            if (!existente) {
                await Servico.create(servico);
                servicosCriados++;
            }
        }

        // Cria cada barbeiro que ainda não existe (pelo email)
        for (const barbeiro of BARBEIROS) {
            const existente = await Barbeiro.findOne({ email: barbeiro.email });

            if (!existente) {
                await Barbeiro.create(barbeiro);
                barbeirosCriados++;
            }
        }

        console.log(`Serviços: ${servicosCriados} criado(s), ${SERVICOS.length - servicosCriados} já existia(m).`);
        console.log(`Barbeiros: ${barbeirosCriados} criado(s), ${BARBEIROS.length - barbeirosCriados} já existia(m).`);

    } finally {
        await mongoose.disconnect();
    }
};

popularDemo().catch(erro => {
    console.error('Erro ao cadastrar os dados de demonstração:', erro.message);
    console.error('Verifique se o banco está rodando (npm run dev em outro terminal).');
    process.exitCode = 1;
});
