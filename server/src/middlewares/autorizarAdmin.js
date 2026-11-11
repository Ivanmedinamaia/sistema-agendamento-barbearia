// Middleware responsável por verificar o nível de acesso do usuário
const autorizarAdmin = (req, res, next) => {

    // Verifica se o usuário está autenticado
    if(!req.usuario) {
        return res.status(401).json({
            mensagem: 'Acesso negado. Usuário não autenticado.'
        });
    }

    // Verifica se o usuário possui permissão de administrador
    if(req.usuario.tipo !== 'admin') {
        return res.status(403).json({
            mensagem: 'Acesso proibido. Apenas administradores podem realizar esta operação.'
        });
    }

    // Permite que o administrador continue para a proxima etapa
    next();


};

// Exporta o middleware para utilização nas rotas

module.exports = autorizarAdmin;