// Carregar as variáveis do arquivo .env
require('dotenv').config();

// Verifica se as variáveis de ambiente obrigatórias foram configuradas
const variaveisObrigatorias = ['MONGODB_URI', 'JWT_SECRET'];
const variaveisAusentes = variaveisObrigatorias.filter(nome => !process.env[nome]);

if (variaveisAusentes.length > 0) {
    console.error(
        `Variáveis de ambiente obrigatórias não configuradas: ${variaveisAusentes.join(', ')}. ` +
        'Consulte o arquivo .env.example.'
    );
    process.exit(1);
}

// Importa a aplicação Express
const app = require('./src/app');

// Importa a função de conexão com o MongoDB
const conectarBanco = require('./src/config/database');

// Define a porta do servidor
const PORT = process.env.PORT || 3000;

// Função responsável por iniciar o servidor
const iniciarServidor = async () => {
    // Primeiro conecta ao banco de dados
    await conectarBanco();

    // Depois inicia o servidor Express
    app.listen(PORT, () => {
        console.log(`Servidor executando na porta ${PORT}`);
    });
};

// Executar a função de inicialização
iniciarServidor();
