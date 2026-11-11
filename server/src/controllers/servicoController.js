// Importa o Model de serviços
const Servico = require('../models/Servico');

// Importa o schema responsavel por validar os dados dos serviços
const { cadastroServicoSchema,
        atualizarServicoSchema
    } = require('../validators/servicoValidator');

const mongoose = require('mongoose');
 
// Função responsável por cadastrar um novo serviço
const cadastrarServico = async (req, res) => {
    try {
        const { error, value } = cadastroServicoSchema.validate(req.body);

        if( error ) {
            return res.status(400).json({
                mensagem: error.details[0].message
            });
        }

        const { nome, descricao, preco, duracaoMinutos } = value;
        const novoServico = await Servico.create({
            nome,
            descricao, 
            preco,
            duracaoMinutos
        });

        return res.status(201).json({
            mensagem: 'Serviço cadastrado com sucesso!',
            servico: {
                id: novoServico._id,
                nome: novoServico.nome,
                descricao: novoServico.descricao,
                preco: novoServico.preco,
                duracaoMinutos: novoServico.duracaoMinutos,
                ativo: novoServico.ativo
            }
        });

    } catch (erro) {
        console.error('Erro ao cadastrar serviço:', erro);
        return res.status(500).json({
            mensagem: 'Erro interno ao cadastrar serviço.'
        });

    }

}

// Função responsável por listar todos os serviços
const listarServicos = async (req, res) => {
    try {
        // Busca todos os serviços cadastrados
        const servicos = await Servico.find({ ativo: true});
        return res.status(200).json({
            quantidade: servicos.length,
            servicos
        });

    } catch (erro) {
        console.error('Erro ao listar serviços:', erro);

        return res.status(500).json({
            mensagem: 'Erro interno ao listar serviços.'
        });
    }

};

// Função responsável por buscar um serviço pelo ID
const buscarServicoPorId = async (req, res) => {

    // Obtém o ID do serviço enviado pelo URL
    const { id } = req.params;

    // Verifica se o ID possui um formato válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            mensagem: 'ID do serviço inválido.'
        });
    }

    try {
        // Busca somente serviços ativos pelo ID no MongoDB
        const servico = await Servico.findOne({
            _id: id,
            ativo: true
        });

        // Verifica se o serviço foi encontrado
        if(!servico) {
            return res.status(404).json({
                mensagem: 'Serviço não encontrado.'
            });
        }

        // Retorna os dados do serviço encontrado
        return res.status(200).json({
            servico
        });

    } catch (erro) {
        console.error('Erro ao buscar serviço', erro);

        return res.status(500).json({
            mensagem: 'Erro interno ao buscar serviço.'
        });
    }

}


// Função responsável por atualizar um serviço
const atualizarServico = async (req, res) => {
    // Obtém o ID do serviço enviado pela URL
    const { id } = req.params;

    // Verifica se o ID possui um formato válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            mensagem: 'ID do serviço inválido.'
        });
    }

    try {
        // Valida os dados enviados para atualização
        const { error, value } = atualizarServicoSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                mensagem: error.details[0].message
            });
        }

        // Atualiza o serviço no MongoDB
        const servicoAtualizado = await Servico.findByIdAndUpdate(
            id,
            value,
            {
                returnDocument: 'after',
                runValidators: true
            }
        );

        // Verifica se o serviço existe
        if (!servicoAtualizado) {
            return res.status(404).json({
                mensagem: 'Serviço não encontrado.'
            });
        }

        // Retorna o serviço atualizado
        return res.status(200).json({
            mensagem: 'Serviço atualizado com sucesso.',
            servico: servicoAtualizado
        });

    } catch (erro) {
        console.error('Erro ao atualizar serviço:', erro);

        return res.status(500).json({
            mensagem: 'Erro interno ao atualizar serviço.'
        });
    }
};


// Função responsável por excluir um serviço
const excluirServico = async (req, res) => {
    // Obtém o ID do serviço enviado pela URL
    const { id } = req.params;

    // Verifica se o ID possui um formato válido
    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            mensagem: 'ID do serviço inválido.'
        });
    }

    try {
        // Localiza o serviço e realiza a sua desativação
        const servicoDesativado = await Servico.findByIdAndUpdate(
            id,
            { ativo: false },
            { returnDocument: 'after' }
        );

        // Verifica se o serviço foi encontrado
        if(!servicoDesativado) {
            return res.status(404).json({
                mensagem: 'Serviço não encontrado.'
            });

        }
        // Retorna a confirmação da exclusão
        return res.status(200).json({
            mensagem: 'Serviço desativado com sucesso.'
        });

    } catch (erro){
        console.error('Erro ao excluir serviço:', erro);

        return res.status(500).json({
            mensagem: 'Erro interno ao desativar o serviço.'
        });
    }
    
}

// Exporta as funções do controller
module.exports = {
    cadastrarServico,
    listarServicos,
    buscarServicoPorId,
    atualizarServico,
    excluirServico
};