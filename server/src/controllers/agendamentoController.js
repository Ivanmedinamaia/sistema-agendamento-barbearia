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

// Define o fuso horário utilizado pela barbearia
const FUSO_HORARIO = 'America/Boa_Vista';


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

            // Verifica se o uruário ainda existe no banco de dados
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

            // Verifica se a data é válida e se está no futuro
            if (isNaN(dataHora.getTime()) || dataHora <= new Date()) {
                return res.status(400).json({
                    mensagem: 'Não é possível realizar agendamentos em datas ou horários passados ou inválidos.'
                });
            }

            // Calcula o horário de término do atendimento

            const dataHoraFim = new Date(
                dataHora.getTime() + servico.duracaoMinutos*60000
            );

            // Converte as datas para o fuso horário da barbearia
            const dataHoraLocal = toZonedTime(dataHora, FUSO_HORARIO);
            const dataHoraFimLocal = toZonedTime(dataHoraFim, FUSO_HORARIO);

            // Obtém a data local do agendamento no formato YYYY-MM-DD
            const dataLocal = [
                dataHoraLocal.getFullYear(),
                String(dataHoraLocal.getMonth() + 1).padStart(2, '0'),
                String(dataHoraLocal.getDate()).padStart(2, '0')
            ].join('-');

            // Obtém o início do dia no fuso horário da barbearia
            const inicioDia = fromZonedTime(
                `${dataLocal}T00:00:00`,
                FUSO_HORARIO
            );

            // Obtém o dia da semana e os horários de atendimento
            const diaSemana = dataHoraLocal.getDay();
            const horaInicio = dataHoraLocal.getHours()*60 + dataHoraLocal.getMinutes();
            const horaFim = dataHoraFimLocal.getHours()*60 + dataHoraFimLocal.getMinutes();

            // Verifica se o horário de início respeita intervalos de 20 minutos
            if(
                horaInicio%20 !== 0 ||
                dataHoraLocal.getSeconds() !== 0 ||
                dataHoraLocal.getMilliseconds() !==0
            ){
                return res.status(400).json({
                    mensagem: 'Os agendamentos devem começar em intervalos de 20 minutos.'
                });
            }

            // Define os limites do expediente em minutos
            const inicioExpediente = 8*60;
            const inicioAlmoco = 12*60;
            const fimAlmoco = 13*60;
            const fimExpediente = 18*60;

            //Verifica se a barbearia está fechada no dia informado
            if (diaSemana === 0) {
                return res.status(400).json({
                    mensagem: 'A barbearia não funciona aos domingos.'
                });
            }

            // Verifica se o atendimento está dentro do expediente
            if (horaInicio < inicioExpediente || horaFim > fimExpediente) {
                return res.status(400).json({
                    mensagem: 'O atendimento deve ocorrer entre as 08h e 18h.'
                });
            }

            // Verifica se o atendimento invade o intervalo de almoço
            if(horaInicio < fimAlmoco && horaFim > inicioAlmoco) {
                return res.status(400).json({
                    mensagem: 'Não são permitidos atendimentos entre 12h e 13h.'
                });
            }




            // Busca os agendamentos ativos do mesmo barbeiro
            // que começam antes do término do novo atendimento
            const agendamentosExistentes = await Agendamento.find({
                barbeiro: req.body.barbeiro,
                status: 'agendado',
                dataHora: {
                    $gte: inicioDia,
                    $lt: dataHoraFim
                }
            }).populate('servico', 'duracaoMinutos');

            //Verifica se algum agendamento existente ocupa o horário desejado
            const conflito = agendamentosExistentes.some(agendamento => {

                // Verifica se o serviço relacionado ao agendamento existe
                if (!agendamento.servico) {
                    return true;
                }

                // Obtém o horário de início do agendamento existente
                const inicioExistente = new Date(agendamento.dataHora);

                // Calcula o horário de início do agendamento existente
                const fimExistente = new Date(
                    inicioExistente.getTime() + 
                    agendamento.servico.duracaoMinutos*60000
                );

                // Verifica se existe sobreposição entre os atendimentos
                return fimExistente > dataHora;


            });

            // Impede o agendamento caso exista conflito
            if(conflito) {
                return res.status(409).json({
                    mensagem: 'Este barbeiro já possui um agendamento neste horário.'
                });
            }

            // Cria o agendamento no banco de dados
            const agendamento = await Agendamento.create({
                usuario: usuario._id,
                servico: servico._id,
                barbeiro: barbeiro._id,
                dataHora: dataHora,
                status: 'agendado'
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
            
            // Registra o erro no console
            console.error('Erro ao cadastrar agendamento:', erro);

            return res.status(500).json({
                mensagem: 'Erro interno ao cadastrar agendamento.'
            });
        }

};

// Lista os agendamentos
const listarAgendamentos = async (req, res) => {
    try {

        // Define o filtro de acordo com o tipo de usuário
        const filtro = req.usuario.tipo === 'admin'
            ? {}
            : { usuario: req.usuario.id };

        // Busca os agendamentos no banco de dados
        const agendamentos = await Agendamento.find(filtro)
            .populate('usuario', 'nome email')
            .populate('servico', 'nome preco duracaoMinutos')
            .populate('barbeiro', 'nome especialidade')
            .sort({ dataHora: 1});

        // Retorna os agendamentos encontrados
        return res.status(200).json({
            quantidade: agendamentos.length,
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

        // Verifica se o agendamento existe e percente ao usuário
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

// Atualiza um agendamento exitente
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
                mensagem: 'Barbeiro não encontrado ou indisponivel.'
            });
        }

        // Obtém a nova data e o horário informados pelo cliente
        const dataHora = new Date(req.body.dataHora);

        // Verifica se a nova data é válida e está no futuro
        if(isNaN(dataHora.getTime()) || dataHora <= new Date()) {
            return res.status(400).json({
                mensagem: 'Não é possível remarcar para datas ou horários passados ou inválidos.'
            });
        }

        // Calcula o horário de término do novo atendimento
        const dataHoraFim =  new Date(
            dataHora.getTime() + servico.duracaoMinutos*60000

        );

        // Converte as datas para o fuso horário da barbearia
        const dataHoraLocal = toZonedTime(dataHora, FUSO_HORARIO);
        const dataHoraFimLocal = toZonedTime(dataHoraFim, FUSO_HORARIO);

        // Obtém a data local do agendamento no formato YYYY-MM-DD
            const dataLocal = [
                dataHoraLocal.getFullYear(),
                String(dataHoraLocal.getMonth() + 1).padStart(2, '0'),
                String(dataHoraLocal.getDate()).padStart(2, '0')
            ].join('-');

            // Obtém o início do dia no fuso horário da barbearia
            const inicioDia = fromZonedTime(
                `${dataLocal}T00:00:00`,
                FUSO_HORARIO
            );

        // Obtém o dia da semana e os horários de atendimento.
        const diaSemana = dataHoraLocal.getDay();
        const horaInicio = dataHoraLocal.getHours()*60 + dataHoraLocal.getMinutes();
        const horaFim = dataHoraFimLocal.getHours()*60 + dataHoraFimLocal.getMinutes();

        // Verifica se o horário de início repeita intervalos de 20 minutos
        if (
            horaInicio%20 !== 0 ||
            dataHoraLocal.getSeconds() !== 0 ||
            dataHoraLocal.getMilliseconds() !== 0
        ){
            return res.status(400).json({
                mensagem: 'Os agendamentos devem começar em intervalos de 20 minutos.'
            });
        }
        
        // Define os limites do expediente em minutos
        const inicioExpediente = 8*60;
        const inicioAlmoco = 12*60;
        const fimAlmoco = 13*60;
        const fimExpediente = 18*60;

        // Verifica se a barbearia está fechada no dia informado
        if (diaSemana === 0) {
            return res.status(400).json({
                mensagem: 'A barbearia não funciona aos domingos.'
            });
        }

        // Verifica se o atendimento está dentro do expediente
        if (horaInicio < inicioExpediente || horaFim > fimExpediente) {
            return res.status(400).json({
                mensagem: 'O atendimento deve ocorrer entre as 08h e 18h.'
            });
        }

        // Verifica se o atendimento invade o intervalo de almoço
        if(horaInicio < fimAlmoco && horaFim > inicioAlmoco) {
            return res.status(400).json({
                mensagem: 'Não são permitidos atendimentos entre 12h e 13h.'
            });
        }

        // Busca os agendamentos ativos do novo barbeiro
        // Excluindo o próprio agendamento que está sendo atualizado

        const agendamentosExistentes = await Agendamento.find({
            _id: { $ne: id },
            barbeiro: req.body.barbeiro,
            status: 'agendado',
            dataHora: {
                $gte: inicioDia,
                $lt: dataHoraFim
            }
        }).populate('servico', 'duracaoMinutos');

        // Verifica se algum agendamento existente ocupa o horário desejado
        const conflito = agendamentosExistentes.some(agendamento => {

            // Verifica se o serviço relacionado ao agendamento existe
            if (!agendamento.servico) {
                return true;
            }

            // Obtém o horário de início do agendamento existente
            const inicioExistente = new Date(agendamento.dataHora);

            // Calcula o horário de término do agendamento existente
            const fimExistente = new Date(inicioExistente.getTime() + 
            agendamento.servico.duracaoMinutos*60000
        );

        // verifica se existe sobreposição entre os atendimentos
        return fimExistente > dataHora;
        
        });

        // Impede a atualização caso exista conflito
        if (conflito){
            return res.status(409).json({
                mensagem: 'Este barbeiro já possui um agendamento neste horário.'
            });
        }

        // Atualiza os dados do agendamento no banco de dados
        const agendamentoAtualizado = await Agendamento.findOneAndUpdate(
            filtro,
            {
                servico: servico._id,
                barbeiro: barbeiro._id,
                dataHora: dataHora
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
        // Obtém os parâmetros enviados pela URL
        const { barbeiro, servico, data } = req.query;

        // Verifica se todos os parâmetros foram informados
        if (!barbeiro || !servico || !data) {
            return res.status(400).json({
                mensagem: 'Informe o barbeiro, o serviço e a data desejada.'
            });
        }

        // Verifica se os IDs possuem formato válido
        if (
            !mongoose.Types.ObjectId.isValid(barbeiro) ||
            !mongoose.Types.ObjectId.isValid(servico)
        ) {
            return res.status(400).json({
                mensagem: 'ID do barbeiro ou serviço inválido.'
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

        // Obtém a data e hora atual no fuso horário de Boa Vista
        const agoraLocal = toZonedTime(new Date(), FUSO_HORARIO);

        // Monta a data atual no formato YYYY-MM-DD
        const dataAtual = [
            agoraLocal.getFullYear(),
            String(agoraLocal.getMonth() + 1).padStart(2, '0'),
            String(agoraLocal.getDate()).padStart(2, '0')
        ].join('-');

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

        // Converte o início e o fim do dia para o fuso de Boa Vista
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
        const agendamentosExistentes = await Agendamento.find({
            barbeiro: barbeiro,
            status: 'agendado',
            dataHora: {
                $gte: inicioDia,
                $lt: fimDia
            }
        }).populate('servico', 'duracaoMinutos');

        // Define os períodos de funcionamento em minutos
        const periodos = [
            { inicio: 8 * 60, fim: 12 * 60 },
            { inicio: 13 * 60, fim: 18 * 60 }
        ];

        // Obtém a duração do serviço
        const duracao = servicoEncontrado.duracaoMinutos;

        // Obtém a data e a hora atuais
        const agora = new Date();

        // Armazena os horários disponíveis
        const horariosDisponiveis = [];

        // Percorre os períodos de funcionamento
        for (const periodo of periodos) {

            // Percorre os horários em intervalos de 20 minutos
            for (
                let minuto = periodo.inicio;
                minuto + duracao <= periodo.fim;
                minuto += 20
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

                    // Ignora registros sem serviço relacionado
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
    atualizarAgendamento,
    consultarDisponibilidade
};