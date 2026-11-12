const { toZonedTime, fromZonedTime } = require('date-fns-tz');
const mongoose = require('mongoose');

// Importa o Model de agendamento
const Agendamento = require('../models/Agendamento');

// Importa os Models relacionados ao agendamento
const Usuario = require('../models/Usuario');
const Servico = require('../models/Servico');
const Barbeiro = require('../models/Barbeiro');

//Importa o Schema de validação dos agendamentos
const { cadastroAgendamentoSchema } = require('../validators/agendamentoValidator');

// Importa as regras de horário de funcionamento da barbearia
const {
    FUSO_HORARIO,
    INTERVALO_MINUTOS,
    PERIODOS_ATENDIMENTO,
    formatarDataLocal,
    validarHorarioAgendamento
} = require('../utils/horarioAgendamento');

// Mensagem retornada quando o horário já está ocupado
const MENSAGEM_CONFLITO = 'Este barbeiro já possui um agendamento neste horário.';

// Limites da paginação da listagem de agendamentos
const LIMITE_PADRAO = 20;
const LIMITE_MAXIMO = 100;

// Valores aceitos nos filtros da listagem de agendamentos
const PERIODOS_VALIDOS = ['proximos', 'anteriores'];
const STATUS_VALIDOS = ['agendado', 'concluido', 'cancelado'];


// Verifica se o barbeiro já possui um agendamento ativo que se sobrepõe
// ao intervalo informado. O parâmetro ignorarId permite desconsiderar o
// próprio agendamento durante uma atualização.
const existeConflito = async ({ barbeiro, inicioDia, dataHora, dataHoraFim, ignorarId }) => {

    // Busca os agendamentos ativos do barbeiro no mesmo dia
    // que começam antes do término do novo atendimento
    const filtro = {
        barbeiro,
        status: 'agendado',
        dataHora: {
            $gte: inicioDia,
            $lt: dataHoraFim
        }
    };

    if (ignorarId) {
        filtro._id = { $ne: ignorarId };
    }

    const agendamentosExistentes = await Agendamento.find(filtro)
        .populate('servico', 'duracaoMinutos');

    // Verifica se algum agendamento existente termina depois do início do novo
    return agendamentosExistentes.some(agendamento => {

        // Considera conflito caso o serviço relacionado não exista mais
        if (!agendamento.servico) {
            return true;
        }

        // Calcula o horário de término do agendamento existente
        const fimExistente = new Date(
            agendamento.dataHora.getTime() +
            agendamento.servico.duracaoMinutos * 60000
        );

        return fimExistente > dataHora;
    });
};


// Cadastra um novo agendamento
const cadastrarAgendamento = async (req, res) => {

    try{
            // Valida os dados recebidos na requisição
            const { error } = cadastroAgendamentoSchema.validate(req.body);

            // Verifica se os dados possuem algum erro
            if (error) {
                return res.status(400).json({
                    mensagem: error.details[0].message
                });
            }

            // Busca o usuário autenticado pelo ID presente no token JWT
            const usuario = await Usuario.findById(req.usuario.id);

            // Verifica se o usuário ainda existe no banco de dados
            if (!usuario) {
                return res.status(404).json({
                    mensagem: 'Usuário não encontrado.'
                })
            }

            // Busca o serviço informado pelo cliente
            const servico = await Servico.findById(req.body.servico);

            // Verifica se o serviço existe e está ativo
            if (!servico || !servico.ativo) {
                return res.status(404).json({
                    mensagem: 'Serviço não encontrado ou indisponível.'
                });
            }

            // Busca o barbeiro informado pelo cliente
            const barbeiro = await Barbeiro.findById(req.body.barbeiro);

            // Verifica se o barbeiro existe e está ativo
            if(!barbeiro || !barbeiro.ativo){
                return res.status(404).json({
                    mensagem: 'Barbeiro não encontrado ou indisponível.'
                });
            }

            // Obtém a data e o horário informados pelo cliente
            const dataHora = new Date(req.body.dataHora);

            // Valida dia, expediente, almoço e intervalo de 20 minutos
            const horario = validarHorarioAgendamento(dataHora, servico.duracaoMinutos);

            if (horario.erro) {
                return res.status(400).json({
                    mensagem: horario.erro
                });
            }

            // Verifica se o barbeiro já está ocupado no horário desejado
            const conflito = await existeConflito({
                barbeiro: barbeiro._id,
                inicioDia: horario.inicioDia,
                dataHora,
                dataHoraFim: horario.dataHoraFim
            });

            // Impede o agendamento caso exista conflito
            if(conflito) {
                return res.status(409).json({
                    mensagem: MENSAGEM_CONFLITO
                });
            }

            // Cria o agendamento no banco de dados.
            // O índice único de horariosOcupados garante que duas requisições
            // simultâneas não consigam reservar o mesmo horário.
            const agendamento = await Agendamento.create({
                usuario: usuario._id,
                servico: servico._id,
                barbeiro: barbeiro._id,
                dataHora: dataHora,
                status: 'agendado',
                horariosOcupados: horario.horariosOcupados
            });

            // Retorna a confirmação do agendamento
            return res.status(201).json({
                mensagem: 'Agendamento realizado com sucesso!',
                agendamento: {
                    id: agendamento._id,
                    usuario: usuario.nome,
                    servico: servico.nome,
                    barbeiro: barbeiro.nome,
                    dataHora: agendamento.dataHora,
                    status: agendamento.status
                }
            });

        }catch (erro) {

            // Outro agendamento ocupou o horário ao mesmo tempo
            if (erro.code === 11000) {
                return res.status(409).json({
                    mensagem: MENSAGEM_CONFLITO
                });
            }

            // Registra o erro no console
            console.error('Erro ao cadastrar agendamento:', erro);

            return res.status(500).json({
                mensagem: 'Erro interno ao cadastrar agendamento.'
            });
        }

};

// Lista os agendamentos com paginação e filtros opcionais
// (?pagina=1&limite=20&periodo=proximos|anteriores&status=agendado|concluido|cancelado)
const listarAgendamentos = async (req, res) => {
    try {

        const { periodo, status } = req.query;

        // Verifica se os filtros informados são válidos
        if (periodo !== undefined && !PERIODOS_VALIDOS.includes(periodo)) {
            return res.status(400).json({
                mensagem: 'Período inválido. Use proximos ou anteriores.'
            });
        }

        if (status !== undefined && !STATUS_VALIDOS.includes(status)) {
            return res.status(400).json({
                mensagem: 'Status inválido. Use agendado, concluido ou cancelado.'
            });
        }

        // Define o filtro de acordo com o tipo de usuário
        const filtro = req.usuario.tipo === 'admin'
            ? {}
            : { usuario: req.usuario.id };

        // Aplica o filtro de status
        if (status) {
            filtro.status = status;
        }

        // Próximos: do mais cedo para o mais tarde.
        // Anteriores: do mais recente para o mais antigo.
        let ordem = 1;

        if (periodo === 'proximos') {
            filtro.dataHora = { $gte: new Date() };
        }

        if (periodo === 'anteriores') {
            filtro.dataHora = { $lt: new Date() };
            ordem = -1;
        }

        // Obtém a página e o limite informados, respeitando os valores permitidos
        const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 1);
        const limite = Math.min(
            Math.max(parseInt(req.query.limite, 10) || LIMITE_PADRAO, 1),
            LIMITE_MAXIMO
        );

        // Busca o total e a página de agendamentos no banco de dados
        const [total, agendamentos] = await Promise.all([
            Agendamento.countDocuments(filtro),
            Agendamento.find(filtro)
                .populate('usuario', 'nome email')
                .populate('servico', 'nome preco duracaoMinutos')
                .populate('barbeiro', 'nome especialidade')
                .sort({ dataHora: ordem })
                .skip((pagina - 1) * limite)
                .limit(limite)
        ]);

        // Retorna os agendamentos encontrados
        return res.status(200).json({
            quantidade: agendamentos.length,
            total,
            pagina,
            limite,
            totalPaginas: Math.ceil(total / limite),
            agendamentos
        });
    } catch (erro) {
        // Registra o erro no console
        console.error('Erro ao listar agendamentos.', erro);

        return res.status(500).json({
            mensagem: 'Erro interno ao listar agendamentos.'
        });
    }
};

// Buscar um agendamento pelo ID
const buscarAgendamentoPorId = async (req, res) => {
    try{

        // Obtém o ID informado na URL
        const { id } = req.params;

        // Verifica se o ID possui um formato válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                mensagem: 'Id do agendamento inválido.'
            });
        }

        // Define o filtro de acordo com o tipo de usuário
        const filtro = req.usuario.tipo === 'admin'
            ? { _id: id}
            : { _id: id, usuario: req.usuario.id };

        // Busca o agendamento e carrega os dados relacionados
        const agendamento = await Agendamento.findOne(filtro)
        .populate('usuario', 'nome email')
        .populate('servico', 'nome preco duracaoMinutos')
        .populate('barbeiro', 'nome especialidade');

        // Verifica se o agendamento existe e pertence ao usuário
        if (!agendamento) {
            return res.status(404).json({
                mensagem: 'Agendamento não encontrado.'
            });

        }

        // Retorna os dados do agendamento
        return res.status(200).json({
            agendamento
        });

    } catch (erro) {

        // Registra o erro no console
        console.error('Erro ao buscar agendamento.', erro);

        return res.status(500).json({
            mensagem: 'Erro interno ao buscar agendamento.'
        });
    }
};

// Cancela um agendamento
const cancelarAgendamento = async (req, res) => {

    try {

        // Obtém o ID informado na URL
        const { id } = req.params;

        // Verifica se o ID possui um formato válido
        if(!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                mensagem: 'ID do agendamento inválido.'
            });
        }

        // Define o filtro de acordo com o tipo de usuário
        const filtro = req.usuario.tipo === 'admin'
            ? { _id: id, status: 'agendado' }
            : {
                _id: id,
                usuario: req.usuario.id,
                status: 'agendado'
            };

        // Atualiza o status do agendamento
        const agendamento = await Agendamento.findOneAndUpdate(
            filtro,
            { status: 'cancelado' },
            { returnDocument: 'after' }
        );

        // Verifica se o agendamento foi encontrado e cancelado
        if (!agendamento) {
            return res.status(404).json({
                mensagem: 'Agendamento não encontrado ou não pode ser cancelado.'
            });
        }

        //  Retorna a confirmação do cancelamento
        return res.status(200).json({
            mensagem: 'Agendamento cancelado com sucesso.',
            agendamento
        });


    } catch (erro) {

        // Registra o erro no console
        console.error('Erro ao cancelar agendamento:', erro);

        return res.status(500).json({
            mensagem: 'Erro interno ao cancelar agendamento.'
        });
    }
};

// Marca um agendamento como concluído (somente administrador)
const concluirAgendamento = async (req, res) => {

    try {

        // Obtém o ID informado na URL
        const { id } = req.params;

        // Verifica se o ID possui um formato válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                mensagem: 'ID do agendamento inválido.'
            });
        }

        // Só é possível concluir um atendimento agendado que já começou
        const agendamento = await Agendamento.findOneAndUpdate(
            {
                _id: id,
                status: 'agendado',
                dataHora: { $lte: new Date() }
            },
            { status: 'concluido' },
            { returnDocument: 'after' }
        );

        // Verifica se o agendamento foi encontrado e concluído
        if (!agendamento) {
            return res.status(404).json({
                mensagem: 'Agendamento não encontrado, já finalizado ou ainda não iniciado.'
            });
        }

        // Retorna a confirmação da conclusão
        return res.status(200).json({
            mensagem: 'Agendamento concluído com sucesso.',
            agendamento
        });

    } catch (erro) {

        // Registra o erro no console
        console.error('Erro ao concluir agendamento:', erro);

        return res.status(500).json({
            mensagem: 'Erro interno ao concluir agendamento.'
        });
    }
};

// Atualiza um agendamento existente
const atualizarAgendamento = async (req, res) => {
    try{
        // Obtém o ID do agendamento informado na URL
        const { id } = req.params;

        // Verifica se o ID possui um formato válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                mensagem: 'ID do agendamento inválido.'
            });
        }

        // Define o filtro de acordo com o tipo de usuário
        const filtro = req.usuario.tipo === 'admin'
            ? { _id: id, status: 'agendado'}
            : {
                _id: id,
                usuario: req.usuario.id,
                status: 'agendado'
            };

        // Busca o agendamento respeitando as permissões do usuário
        const agendamento = await Agendamento.findOne(filtro);

        // Verifica se o agendamento existe e pode ser atualizado
        if(!agendamento) {
            return res.status(404).json({
                mensagem: 'Agendamento não encontrado ou não pode ser atualizado.'

            });
        }

        // Valida os novos dados recebidos na requisição
        const { error } = cadastroAgendamentoSchema.validate(req.body);

        // Verifica se os dados possuem algum erro
        if(error) {
            return res.status(400).json({
                mensagem: error.details[0].message
            });
        }

        // Busca o novo serviço informado pelo cliente
        const servico = await Servico.findById(req.body.servico);

        // Verifica se o serviço existe e está ativo
        if(!servico || !servico.ativo) {
            return res.status(404).json ({
                mensagem: 'Serviço não encontrado ou indisponível.'
            });
        }

        // Busca o novo barbeiro informado pelo cliente
        const barbeiro = await Barbeiro.findById(req.body.barbeiro);

        // Verifica se o barbeiro existe e está disponível
        if(!barbeiro || !barbeiro.ativo){
            return res.status(404).json({
                mensagem: 'Barbeiro não encontrado ou indisponível.'
            });
        }

        // Obtém a nova data e o horário informados pelo cliente
        const dataHora = new Date(req.body.dataHora);

        // Valida dia, expediente, almoço e intervalo de 20 minutos
        const horario = validarHorarioAgendamento(dataHora, servico.duracaoMinutos);

        if (horario.erro) {
            return res.status(400).json({
                mensagem: horario.erro
            });
        }

        // Verifica conflitos com outros agendamentos do novo barbeiro,
        // desconsiderando o próprio agendamento que está sendo atualizado
        const conflito = await existeConflito({
            barbeiro: barbeiro._id,
            inicioDia: horario.inicioDia,
            dataHora,
            dataHoraFim: horario.dataHoraFim,
            ignorarId: id
        });

        // Impede a atualização caso exista conflito
        if (conflito){
            return res.status(409).json({
                mensagem: MENSAGEM_CONFLITO
            });
        }

        // Atualiza os dados do agendamento no banco de dados
        const agendamentoAtualizado = await Agendamento.findOneAndUpdate(
            filtro,
            {
                servico: servico._id,
                barbeiro: barbeiro._id,
                dataHora: dataHora,
                horariosOcupados: horario.horariosOcupados
            },

            {
                returnDocument: 'after',
                runValidators: true
            }
        );

        // Verifica se o agendamento ainda pode ser atualizado
        if(!agendamentoAtualizado) {
            return res.status(404).json({
                mensagem: 'Agendamento não encontrado ou não pode ser atualizado.'
            });
        }

        // Retorna a confirmação da atualização
        return res.status(200).json({
            mensagem: 'Agendamento atualizado com sucesso.',
            agendamento: agendamentoAtualizado
        });

    } catch(erro) {

        // Outro agendamento ocupou o horário ao mesmo tempo
        if (erro.code === 11000) {
            return res.status(409).json({
                mensagem: MENSAGEM_CONFLITO
            });
        }

        // Registra o erro no console
        console.error('Erro ao atualizar o agendamento:', erro);

        return res.status(500).json({
            mensagem: 'Erro interno ao atualizar o agendamento.'
        });
    }
};


 // Consulta os horários disponíveis para agendamento
const consultarDisponibilidade = async (req, res) => {

    try {
        // Obtém os parâmetros enviados pela URL.
        // "ignorar" é opcional: na remarcação, desconsidera o próprio
        // agendamento para que o horário atual apareça como livre.
        const { barbeiro, servico, data, ignorar } = req.query;

        // Verifica se todos os parâmetros foram informados
        if (!barbeiro || !servico || !data) {
            return res.status(400).json({
                mensagem: 'Informe o barbeiro, o serviço e a data desejada.'
            });
        }

        // Verifica se os IDs possuem formato válido
        if (
            !mongoose.Types.ObjectId.isValid(barbeiro) ||
            !mongoose.Types.ObjectId.isValid(servico) ||
            (ignorar !== undefined && !mongoose.Types.ObjectId.isValid(ignorar))
        ) {
            return res.status(400).json({
                mensagem: 'ID do barbeiro, serviço ou agendamento inválido.'
            });
        }

        // Verifica se a data possui o formato YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
            return res.status(400).json({
                mensagem: 'Informe uma data válida no formato YYYY-MM-DD.'
            });
        }

        // Verifica se a data realmente existe
        const dataVerificada = new Date(`${data}T00:00:00Z`);

        if (
            isNaN(dataVerificada.getTime()) ||
            dataVerificada.toISOString().slice(0, 10) !== data
        ) {
            return res.status(400).json({
                mensagem: 'A data informada é inválida.'
            });
        }

        // Obtém o dia da semana da data informada
        const diaSemana = dataVerificada.getUTCDay();

        // Verifica se a barbearia está fechada no domingo
        if (diaSemana === 0) {
            return res.status(400).json({
                mensagem: 'A barbearia não funciona aos domingos.'
            });
        }

        // Obtém a data atual no fuso horário da barbearia (YYYY-MM-DD)
        const dataAtual = formatarDataLocal(
            toZonedTime(new Date(), FUSO_HORARIO)
        );

        // Impede a consulta de datas anteriores à data atual
        if (data < dataAtual) {
            return res.status(400).json({
                mensagem: 'Não é possível consultar horários de datas passadas.'
            });
        }

        // Busca o barbeiro e verifica se está ativo
        const barbeiroEncontrado = await Barbeiro.findOne({
            _id: barbeiro,
            ativo: true
        });

        if (!barbeiroEncontrado) {
            return res.status(404).json({
                mensagem: 'Barbeiro não encontrado ou indisponível.'
            });
        }

        // Busca o serviço e verifica se está ativo
        const servicoEncontrado = await Servico.findOne({
            _id: servico,
            ativo: true
        });

        if (!servicoEncontrado) {
            return res.status(404).json({
                mensagem: 'Serviço não encontrado ou indisponível.'
            });
        }

        // Converte o início e o fim do dia para o fuso da barbearia
        const inicioDia = fromZonedTime(
            `${data}T00:00:00`,
            FUSO_HORARIO
        );

        const proximoDia = new Date(dataVerificada);
        proximoDia.setUTCDate(proximoDia.getUTCDate() + 1);

        const fimDia = fromZonedTime(
            `${proximoDia.toISOString().slice(0, 10)}T00:00:00`,
            FUSO_HORARIO
        );

        // Busca os agendamentos ativos do barbeiro na data consultada
        const filtroAgendamentos = {
            barbeiro: barbeiro,
            status: 'agendado',
            dataHora: {
                $gte: inicioDia,
                $lt: fimDia
            }
        };

        if (ignorar) {
            filtroAgendamentos._id = { $ne: ignorar };
        }

        const agendamentosExistentes = await Agendamento.find(filtroAgendamentos)
            .populate('servico', 'duracaoMinutos');

        // Obtém a duração do serviço
        const duracao = servicoEncontrado.duracaoMinutos;

        // Obtém a data e a hora atuais
        const agora = new Date();

        // Armazena os horários disponíveis
        const horariosDisponiveis = [];

        // Percorre os períodos de funcionamento
        for (const periodo of PERIODOS_ATENDIMENTO) {

            // Percorre os horários em intervalos de 20 minutos
            for (
                let minuto = periodo.inicio;
                minuto + duracao <= periodo.fim;
                minuto += INTERVALO_MINUTOS
            ) {
                // Separa hora e minuto
                const hora = String(Math.floor(minuto / 60)).padStart(2, '0');
                const minutos = String(minuto % 60).padStart(2, '0');

                // Converte o horário local para uma data UTC
                const dataHora = fromZonedTime(
                    `${data}T${hora}:${minutos}:00`,
                    FUSO_HORARIO
                );

                // Calcula o término do atendimento
                const dataHoraFim = new Date(
                    dataHora.getTime() + duracao * 60000
                );

                // Ignora horários que já passaram
                if (dataHora <= agora) {
                    continue;
                }

                // Verifica se existe conflito com outro agendamento
                const conflito = agendamentosExistentes.some(agendamento => {

                    // Considera conflito caso o serviço relacionado não exista mais
                    if (!agendamento.servico) {
                        return true;
                    }

                    // Calcula o término do agendamento existente
                    const fimExistente = new Date(
                        agendamento.dataHora.getTime() +
                        agendamento.servico.duracaoMinutos * 60000
                    );

                    // Verifica sobreposição de horários
                    return (
                        agendamento.dataHora < dataHoraFim &&
                        fimExistente > dataHora
                    );
                });

                // Adiciona o horário caso não exista conflito
                if (!conflito) {
                    horariosDisponiveis.push({
                        horario: `${hora}:${minutos}`,
                        dataHora: dataHora.toISOString()
                    });
                }
            }
        }

        // Retorna os horários encontrados
        return res.status(200).json({
            data,
            barbeiro: barbeiroEncontrado.nome,
            servico: servicoEncontrado.nome,
            duracaoMinutos: duracao,
            quantidade: horariosDisponiveis.length,
            horariosDisponiveis
        });

    } catch (erro) {
        console.error('Erro ao consultar disponibilidade:', erro);

        return res.status(500).json({
            mensagem: 'Erro interno ao consultar disponibilidade.'
        });
    }
};


// Exporta as funções do controller

module.exports = {
    cadastrarAgendamento,
    listarAgendamentos,
    buscarAgendamentoPorId,
    cancelarAgendamento,
    concluirAgendamento,
    atualizarAgendamento,
    consultarDisponibilidade
};
