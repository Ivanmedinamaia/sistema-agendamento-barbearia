// Importa o Model Usuario
const Usuario = require('../models/Usuario');

// Importa o validador de cadastro
const { cadastroSchema, loginSchema} = require('../validators/usuarioValidator');

// Importa o bcrypt para gerar o hash das senhas
const bcrypt = require('bcrypt');

// Importa a biblioteca responsável pela geração de token JWT
const jwt = require('jsonwebtoken');

// Função responsável por casdatrar um usuário
const cadastrarUsuario = async (req, res) => {
    try {


        // 1. Valida os dados recebidos na requisição
        const {error, value} = cadastroSchema.validate(req.body);

        // Se houver erro, retorna uma resposta de validação
        if (error) {
            return res.status(400).json({
                mensagem: error.details[0].message
            });
        }

        // 2. Extrai os dados validadoos
        const {nome, email, senha} = value;

        // 3. Verifica se ja existe um usuário com esse email
        const usuarioExistente = await Usuario.findOne({ email });

        if (usuarioExistente) {
            return res.status(409).json({
                mensagem: 'Este email já está cadastrado.'
            });
        }

        // 4. Gera o hash da senha
        const senhaHash = await bcrypt.hash(senha, 12);

        // 5. Cria o novo usuário
        const novoUsuario = await Usuario.create ({
            nome,
            email,
            senha: senhaHash
        });

        // 6. Retorna os dados do usuário sem expor a senha
        return res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso!',
            usuario: {
                id: novoUsuario._id,
                nome: novoUsuario.nome,
                email: novoUsuario.email,
                tipo: novoUsuario.tipo
            }
        });

    } catch (erro){
        // Registra o erro no terinal do servidor
        console.error('Erro ao cadastrar usuário', erro);

        // Retorna uma mensagem genérica ao cliente
        return res.status(500).json({
            mensagem: 'Erro interno ao cadastrar usuário.'
        })
    }
};

// Função responsável por realizar o login de um usuário
const loginUsuario = async (req, res) => {
    try {
        // 1. Valida os dados recebidos na requisição
        const { error, value} = loginSchema.validate(req.body);

        // Se houver erro, retorna um resposta de validação
        if (error) {
            return res.status(400).json({
                mensagem: error.details[0].message
            });
        }

        // 2. Extrai o email e a senha validados
        const { email, senha} = value;

        // 3. Procura o usuário pelo email no banco de dados
        const usuario = await Usuario.findOne({ email }).select('+senha');

        // Se o usuário não existir, retorna uma mensagem de erro
        if(!usuario){
            return res.status(401).json({
                mensagem: 'Email ou senha inválidos.'
            });
        }

        // 4. Compara a senha informada com o hash armazenado
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        
        // Se a senha estiver incorreta, retorna uma mensagem de erro
        if(!senhaCorreta) {
            return res.status(401).json({
                mensagem: 'Email ou senha inválidos.'
            });
        }

        // 5. Gera o token JWT após autenticar o usuário
        const token = jwt.sign(
            {
                id: usuario._id,
                tipo: usuario.tipo

            },

            process.env.JWT_SECRET,
            {
                expiresIn: '1h',
                algorithm: 'HS256'
            }
        );

        // 6. Retorna o token e os dados publicos do usuário
        return res.status(200).json({
            mensagem:'Login realizado com sucesso!',
            token,
            usuario:{
                id: usuario._id,
                nome: usuario.nome,
                email: usuario.email,
                tipo: usuario.tipo
            }
        });
    } catch (erro) {
        // Registra um erro no terminal do servidor
        console.error('Erro ao realizar o login: ', erro);

        // Retorna uma mensagem genérica ao cliente
        return res.status(500).json({
            mensagem: 'Erro interno ao realizar o login.'
        });
    }
};
// Exportar a função para utilização nas rotas
module.exports = {
    cadastrarUsuario,
    loginUsuario
};