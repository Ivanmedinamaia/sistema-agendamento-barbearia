// Importa a biblioteca responsável por verificar tokens JWT
const jwt = require('jsonwebtoken');

// Middleware para rotas públicas que exibem mais informações
// quando o usuário está autenticado (por exemplo, um administrador).
// Se o token for válido, preenche req.usuario; caso contrário,
// a requisição continua normalmente como visitante.
const autenticacaoOpcional = (req, res, next) => {

    // Obtém o cabeçalho Authorization
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ') && process.env.JWT_SECRET) {
        try {
            req.usuario = jwt.verify(
                authHeader.split(' ')[1],
                process.env.JWT_SECRET,
                { algorithms: ['HS256'] }
            );
        } catch {
            // Token inválido ou expirado: segue como visitante
        }
    }

    next();
};

// Exporta o middleware para utilização nas rotas
module.exports = autenticacaoOpcional;
