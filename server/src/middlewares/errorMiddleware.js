
 // Middleware global para tratamento de erros
const errorMiddleware = (erro, req, res, next) => {

    // Registra o erro no terminal do servidor
    console.error('Erro na aplicação:', erro);

    // Verifica se os cabeçalhos já foram enviados
    if (res.headersSent) {
        return next(erro);
    }

    // Retorna uma resposta genérica ao cliente
    return res.status(500).json({
        mensagem: 'Erro interno do servidor.'
    });
};

// Exporta o middleware
module.exports = errorMiddleware;
