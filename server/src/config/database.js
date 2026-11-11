// Importa o Mongoose
const mongoose = require('mongoose');

//Função responsavel por conectar ao MongoDB
const conectarBanco = async () => {
    try{
        // Tenta estabelecer a conexão com o banco
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('MongoDB conectado com sucesso!');

    }catch (erro) {
        // Exibe o erro caso a conexão falhe
        console.error('Erro ao conectar ao MongoBD: ', erro.message);

        // Encerra a aplicação caso não consiga conectar
        process.exit(1);
    }
};

// Exporta a função de conexão
module.exports = conectarBanco;