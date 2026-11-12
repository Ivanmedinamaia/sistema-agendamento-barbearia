// Importa o Model Usuario
const Usuario = require('../models/Usuario');

// Importa o validador de cadastro
const {
    cadastroSchema,
    loginSchema,
    esqueciSenhaSchema,
    redefinirSenhaSchema
} = require('../validators/usuarioValidator');

// Importa o módulo de criptografia do Node para gerar tokens de recuperação
const crypto = require('crypto');

// Importa o envio de emails
const { enviarEmail } = require('../utils/email');

// Importa o bcrypt para gerar o hash das senhas
const bcrypt = require('bcrypt');

// Importa a biblioteca responsável pela geração de token JWT
const jwt = require('jsonwebtoken');

// Hash fictício usado quando o email não existe. Assim o login leva o mesmo
// tempo para emails cadastrados e não cadastrados, o que impede descobrir
// quais emails existem no sistema medindo o tempo de resposta.
const HASH_FICTICIO = bcrypt.hashSync('senha-ficticia-para-tempo-constante', 12);

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
        // Outro cadastro com o mesmo email foi concluído ao mesmo tempo
        if (erro.code === 11000) {
            return res.status(409).json({
                mensagem: 'Este email já está cadastrado.'
            });
        }

        // Registra o erro no terminal do servidor
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

        // 4. Compara a senha informada com o hash armazenado.
        // Se o usuário não existir, compara com o hash fictício para
        // manter o mesmo tempo de resposta.
        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario ? usuario.senha : HASH_FICTICIO
        );

        // Se o usuário não existir ou a senha estiver incorreta, retorna erro
        if(!usuario || !senhaCorreta) {
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
// Gera o hash SHA-256 de um token de recuperação de senha
const hashDoToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Mensagem igual para emails cadastrados e não cadastrados,
// para não revelar quais emails existem no sistema
const MENSAGEM_ESQUECI_SENHA =
    'Se existir uma conta com esse email, enviamos um link para criar uma nova senha. ' +
    'O link vale por 30 minutos.';

// Validade do link de recuperação, em minutos
const VALIDADE_LINK_MINUTOS = 30;

// Envia um link de recuperação de senha para o email informado
const esqueciSenha = async (req, res) => {
    try {
        const { error, value } = esqueciSenhaSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                mensagem: error.details[0].message
            });
        }

        const usuario = await Usuario.findOne({ email: value.email });

        if (usuario) {
            // Gera um token aleatório; só o hash dele fica salvo no banco
            const token = crypto.randomBytes(32).toString('hex');

            usuario.resetSenhaHash = hashDoToken(token);
            usuario.resetSenhaExpira = new Date(Date.now() + VALIDADE_LINK_MINUTOS * 60000);
            await usuario.save();

            const urlFrontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
            const link = `${urlFrontend}/redefinir-senha?token=${token}`;

            // O envio não é aguardado, para a resposta levar o mesmo tempo
            // para emails cadastrados e não cadastrados
            enviarEmail({
                para: usuario.email,
                assunto: 'Recuperação de senha - Barbearia',
                texto:
                    `Olá, ${usuario.nome}!\n\n` +
                    'Recebemos um pedido para criar uma nova senha para a sua conta.\n' +
                    `Acesse o link abaixo em até ${VALIDADE_LINK_MINUTOS} minutos:\n\n${link}\n\n` +
                    'Se você não fez esse pedido, ignore este email. Sua senha atual continua valendo.'
            }).catch((erro) => console.error('Erro ao enviar email de recuperação:', erro));
        }

        return res.status(200).json({
            mensagem: MENSAGEM_ESQUECI_SENHA
        });

    } catch (erro) {
        console.error('Erro ao solicitar recuperação de senha:', erro);

        return res.status(500).json({
            mensagem: 'Erro interno ao solicitar recuperação de senha.'
        });
    }
};

// Cria uma nova senha usando o token recebido por email
const redefinirSenha = async (req, res) => {
    try {
        const { error, value } = redefinirSenhaSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                mensagem: error.details[0].message
            });
        }

        // Troca a senha e invalida o link na mesma operação,
        // para que o mesmo link não possa ser usado duas vezes
        const usuario = await Usuario.findOneAndUpdate(
            {
                resetSenhaHash: hashDoToken(value.token),
                resetSenhaExpira: { $gt: new Date() }
            },
            {
                senha: await bcrypt.hash(value.senha, 12),
                $unset: { resetSenhaHash: 1, resetSenhaExpira: 1 }
            }
        );

        if (!usuario) {
            return res.status(400).json({
                mensagem: 'Este link de recuperação é inválido ou já expirou. Peça um novo link.'
            });
        }

        return res.status(200).json({
            mensagem: 'Senha alterada com sucesso. Entre com a nova senha.'
        });

    } catch (erro) {
        console.error('Erro ao redefinir senha:', erro);

        return res.status(500).json({
            mensagem: 'Erro interno ao redefinir a senha.'
        });
    }
};

// Exportar a função para utilização nas rotas
module.exports = {
    cadastrarUsuario,
    loginUsuario,
    esqueciSenha,
    redefinirSenha
};