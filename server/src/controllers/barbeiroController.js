// Importa mongoose para validar identificadores
const mongoose = require('mongoose');

// Importa o Model de barbeiro
const Barbeiro = require('../models/Barbeiro');

// Importa o Schema de validação dos barbeiros
const { cadastroBarbeiroSchema,
        atualizarBarbeiroSchema
        } = require('../validators/barbeiroValidator');

// Cadastra um novo barbeiro
const cadastrarBarbeiro = async (req, res) => {

    try{
        //  Valida os dados recebidos na requisição
        const { error, value } = cadastroBarbeiroSchema.validate(req.body);

        if(error) {
            return res.status(400).json({
                mensagem: error.details[0].message
            });
        }


            // Verifica se o email já está cadastrado
            const barbeiroExistente = await Barbeiro.findOne({
                email: value.email
            });
        

        if (barbeiroExistente) {
            return res.status(409).json({
                mensagem: 'Este email já está cadastrado para outro barbeiro.'
            });
        }

        



        // Cria o novo barbeiro no banco de dados
        const novoBarbeiro = await Barbeiro.create(value);

        // Retorna os dados do barbeiro cadastrado
        return res.status(201).json({
            mensagem: 'Barbeiro cadastrado com sucesso.',
            barbeiro: {
                id: novoBarbeiro._id,
                nome: novoBarbeiro.nome,
                especialidade: novoBarbeiro.especialidade,
                telefone: novoBarbeiro.telefone,
                email: novoBarbeiro.email,
                ativo: novoBarbeiro.ativo
            }
        });

    } catch (erro){

        // Verifica se ocorreu uma violação do índice único
        if (erro.code === 11000) {
            return res.status(409).json({
                mensagem: 'Este email já está cadastrado para outro barbeiro.'
            });
        }
        console.error('Erro ao cadastrar barbeiro.', erro);

        return res.status(500).json({
            mensagem: 'Erro interno ao cadastrar barbeiro.'
        });
    }

};


// Lista todos os barbeiro cadastrados
const listarBarbeiros = async (req, res) => {

    try{
        // Busca todos os barbeiros cadastrados
        const barbeiros = await Barbeiro.find({ ativo: true });

        // Retorna a quantidade e os dados encontrados
        return res.status(200).json({
            quantidade: barbeiros.length,
            barbeiros
        });
    } catch (erro){
        console.error('Erro ao listar barbeiros:', erro);

        return res.status(500).json({
            mensagem: 'Erro interno ao listar barbeiros.'
        });
    }

};


// Busca um barbeiro por ID
const buscarBarbeiroPorId = async (req, res) => {
    // Obtém o ID enviado pela requisição
    const { id } = req.params;

    // Verifica se o ID possui um formato válido
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({
            mensagem: 'ID do barbeiro inválido.'
        });
    }

    try {
        // Buscar Barbeiro pelo identificador
        const barbeiro = await Barbeiro.findOne({
            _id: id,
            ativo: true
        });

        // Verifica se o barbeiro foi encontrado
        if(!barbeiro) {
            return res.status(404).json({
                mensagem: 'Barbeiro não encontrado.'

            });
        }

        // Retorna os dados encontrados
        return res.status(200).json({
            barbeiro
        });

    } catch (erro) {
        console.error('Erro ao buscar barbeiro:', erro);

        return res.status(500).json({
            mensagem: 'Erro interno ao buscar barbeiro.'
        });
    }

};


// Atualiza os dados de um barbeiro
const atualizarBarbeiro = async (req, res) => {
    // Obtém o ID enviado pela requisição
    const { id } = req.params;

    // Verifica se o ID possui um formato válido
    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            mensagem: 'ID do barbeiro inválido.'
        });
    }

    try {
        // Valida os dados recebidos para atualização parcial
        const { error, value } = atualizarBarbeiroSchema.validate(req.body);

        if(error) {
            return res.status(400).json({
                mensagem: error.details[0].message
            });
        }

        // Verifica se um novo email foi informado
        if (value.email) {

            // Verifica se outro barbeiro ja utiliza esse email
            const barbeiroExistente = await Barbeiro.findOne({
                email: value.email,
                _id: { $ne: id }
            });
        

        if(barbeiroExistente) {
            return res.status(409).json({
                mensagem: 'Este email já está cadastrado para outro barbeiro.'
            });

            
        }
        }
        // Atualiza os dados do barbeiro no banco de dados
        const barbeiroAtualizado = await Barbeiro.findOneAndUpdate(
            {
                _id: id,
                ativo: true
            },
            value,
            {
                returnDocument: 'after',
                runValidators: true
            }
        );

        // Verifica se o barbeiro existe
        if (!barbeiroAtualizado) {
            return res.status(404).json({
                mensagem: 'Barbeiro não encontrado.'
            });
        }

        // Retorna dados atualizados
        return res.status(200).json({
            mensagem: 'Barbeiro atualizado com sucesso!',
            barbeiro: {
                id: barbeiroAtualizado._id,
                nome: barbeiroAtualizado.nome,
                especialidade: barbeiroAtualizado.especialidade,
                telefone: barbeiroAtualizado.telefone,
                email: barbeiroAtualizado.email,
                ativo: barbeiroAtualizado.ativo
            }
        });

    } catch (erro) {
        // Verifica se ocorreu uma violação no índice único
        if (erro.code === 11000){
            return res.status(409).json({
                mensagem: 'Este email já está cadastrado para outro barbeiro.'
            });
        }

        console.error('Erro ao atualizar barbeiro.', erro);

        return res.status(500).json({
            mensagem: 'Erro interno ao atualizar barbeiro.'
        });
    }
};

// Desativa um barbeiro
const desativarBarbeiro = async (req, res) => {
    // Obtém um ID enviado pela requisição
    const { id } = req.params;

    // Verifica se o ID possui um formato válido
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({
            mensagem: 'ID do barbeiro inválido.'
        });
    }

    try {

        // Altera o campo ativo para false
        const barbeiroDesativado = await Barbeiro.findOneAndUpdate(
        {
            _id: id,
            ativo: true
        },
        { ativo: false },
        { returnDocument: 'after' }
        );

        // Verifica se o barbeiro foi encontrado
        if(!barbeiroDesativado) {
            return res.status(404).json({
                mensagem: 'Barbeiro não encontrado.'
            });
        }

        // Retorna a confirmação da desativação
        return res.status(200).json({
            mensagem: 'Barbeiro desativado com sucesso!',
            barbeiro: {
                id: barbeiroDesativado._id,
                nome: barbeiroDesativado.nome,
                ativo: barbeiroDesativado.ativo
            }
        });

    } catch (erro) {
        console.error('Erro ao desativar barbeiro:', erro);

        return res.status(500).json({
            mensagem: 'Erro interno ao desativar barbeiro.'
        })
    }

}

// Exporta as funções do controller
module.exports = {
    cadastrarBarbeiro,
    listarBarbeiros,
    buscarBarbeiroPorId,
    atualizarBarbeiro,
    desativarBarbeiro
}



