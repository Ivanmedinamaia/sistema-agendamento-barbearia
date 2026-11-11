// Carregar as variáveis do arquivo .env
require('dotenv').config();

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