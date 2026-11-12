
 // Middleware global para tratamento de erros
const errorMiddleware = (erro, req, res, next) => {

    // Verifica se os cabeçalhos já foram enviados
    if (res.headersSent) {
        return next(erro);
    }

    // Corpo da requisição com JSON malformado
    if (erro.type === 'entity.parse.failed') {
        return res.status(400).json({
            mensagem: 'O corpo da requisição contém um JSON inválido.'
        });
    }

    // Corpo da requisição maior que o limite configurado
    if (erro.type === 'entity.too.large') {
        return res.status(413).json({
            mensagem: 'O corpo da requisição excede o tamanho permitido.'
        });
    }

    // Outros erros do cliente (4xx) gerados pelo Express ou por bibliotecas
    const status = erro.status || erro.statusCode;

    if (status >= 400 && status < 500) {
        return res.status(status).json({
            mensagem: erro.expose ? erro.message : 'Requisição inválida.'
        });
    }

    // Registra o erro no terminal do servidor
    console.error('Erro na aplicação:', erro);

    // Retorna uma resposta genérica ao cliente
    return res.status(500).json({
        mensagem: 'Erro interno do servidor.'
    });
};

// Exporta o middleware
module.exports = errorMiddleware;
