// Importa a biblioteca responsável por verificar tokens JWT
const jwt = require('jsonwebtoken');

// Middleware responsável por autentiar usuários
const autenticarUsuario = (req, res, next) => {

    try {
        
        // Verifica se a chave secreta do JWT está configurada
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET não configurado.');
        }
    
    
        // Obtém um token enviado no cabeçalho Authorization
        const authHeader = req.headers.authorization;

        // Verificia se o cabeçalho Authorization foi enviado
        if(!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                mensagem: 'Acesso negado. Token não fornecido.'
            });
        }

        // Separa a palavra Bearer do token JWT
        const token = authHeader.split(' ')[1];

        // Verifica se o token foi informado corretamente
        if(!token){
            return res.status(401).json({
                mensagem: 'Acesso negado. Token inválido.'
            });
        }

        // Verifica a assinatura e a validade do token JWT
        const dadosUsuario = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ['HS256'] }
        );

        // Armazena os dados do usuário na requisição
        req.usuario = dadosUsuario;

        // Permite que a requisição continue para a próxima etapa
        next();



    } catch(erro){
        // Verifica se o token expirou ou é invalido
        if(
            erro.name === 'TokenExpiredError' ||
            erro.name === 'JsonWebTokenError'
        ) {
            return res.status(401).json({
                mensagem:'Token invalido ou expirado.'
            });
        }

        // Registra erros inesperados no terminal do servidor
        console.error('Error ao autenticar usuário: ', erro);

        // Retorna uma resposta de erro interno
        return res.status(500).json({
            mensagem: 'Erro interno ao verificar autenticação.'
        })

    }


};

// Exporta o middleware para utilização nas rotas
module.exports = autenticarUsuario;