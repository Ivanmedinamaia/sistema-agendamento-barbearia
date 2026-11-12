// Importa as funções de conversão de fuso horário
const { toZonedTime, fromZonedTime } = require('date-fns-tz');

// Define o fuso horário utilizado pela barbearia
const FUSO_HORARIO = 'America/Boa_Vista';

// Intervalo, em minutos, entre os horários de início dos atendimentos
const INTERVALO_MINUTOS = 20;

// Limites do expediente, em minutos a partir da meia-noite
const INICIO_EXPEDIENTE = 8 * 60;
const INICIO_ALMOCO = 12 * 60;
const FIM_ALMOCO = 13 * 60;
const FIM_EXPEDIENTE = 18 * 60;

// Períodos em que a barbearia atende
const PERIODOS_ATENDIMENTO = [
    { inicio: INICIO_EXPEDIENTE, fim: INICIO_ALMOCO },
    { inicio: FIM_ALMOCO, fim: FIM_EXPEDIENTE }
];

// Formata uma data (já convertida para o fuso local) no formato YYYY-MM-DD
const formatarDataLocal = (dataLocal) => [
    dataLocal.getFullYear(),
    String(dataLocal.getMonth() + 1).padStart(2, '0'),
    String(dataLocal.getDate()).padStart(2, '0')
].join('-');

// Calcula os blocos de 20 minutos ocupados por um atendimento.
// Esses blocos são gravados no agendamento e protegidos por um índice único,
// o que impede que dois agendamentos do mesmo barbeiro se sobreponham,
// mesmo quando as requisições chegam ao mesmo tempo.
const calcularHorariosOcupados = (dataHora, duracaoMinutos) => {
    const quantidade = Math.ceil(duracaoMinutos / INTERVALO_MINUTOS);

    return Array.from({ length: quantidade }, (_, indice) =>
        new Date(dataHora.getTime() + indice * INTERVALO_MINUTOS * 60000)
    );
};

// Valida se um atendimento pode ocorrer na data e no horário informados.
// Retorna { erro } quando o horário é inválido, ou os dados calculados
// do atendimento quando o horário é válido.
const validarHorarioAgendamento = (dataHora, duracaoMinutos, agora = new Date()) => {

    // Verifica se a data é válida e se está no futuro
    if (isNaN(dataHora.getTime()) || dataHora <= agora) {
        return {
            erro: 'Não é possível agendar em datas ou horários passados ou inválidos.'
        };
    }

    // Converte a data para o fuso horário da barbearia
    const dataHoraLocal = toZonedTime(dataHora, FUSO_HORARIO);

    // Calcula o início e o fim do atendimento em minutos a partir da meia-noite.
    // O fim é calculado pela soma da duração para que um atendimento que
    // ultrapasse a meia-noite não "volte" para o início do dia.
    const horaInicio = dataHoraLocal.getHours() * 60 + dataHoraLocal.getMinutes();
    const horaFim = horaInicio + duracaoMinutos;

    // Verifica se o horário de início respeita intervalos de 20 minutos
    if (
        horaInicio % INTERVALO_MINUTOS !== 0 ||
        dataHoraLocal.getSeconds() !== 0 ||
        dataHoraLocal.getMilliseconds() !== 0
    ) {
        return {
            erro: 'Os agendamentos devem começar em intervalos de 20 minutos.'
        };
    }

    // Verifica se a barbearia está fechada no dia informado
    if (dataHoraLocal.getDay() === 0) {
        return {
            erro: 'A barbearia não funciona aos domingos.'
        };
    }

    // Verifica se o atendimento está dentro do expediente
    if (horaInicio < INICIO_EXPEDIENTE || horaFim > FIM_EXPEDIENTE) {
        return {
            erro: 'O atendimento deve ocorrer entre as 08h e 18h.'
        };
    }

    // Verifica se o atendimento invade o intervalo de almoço
    if (horaInicio < FIM_ALMOCO && horaFim > INICIO_ALMOCO) {
        return {
            erro: 'Não são permitidos atendimentos entre 12h e 13h.'
        };
    }

    // Obtém o início do dia no fuso horário da barbearia
    const inicioDia = fromZonedTime(
        `${formatarDataLocal(dataHoraLocal)}T00:00:00`,
        FUSO_HORARIO
    );

    // Calcula o horário de término do atendimento
    const dataHoraFim = new Date(dataHora.getTime() + duracaoMinutos * 60000);

    return {
        inicioDia,
        dataHoraFim,
        horariosOcupados: calcularHorariosOcupados(dataHora, duracaoMinutos)
    };
};

module.exports = {
    FUSO_HORARIO,
    INTERVALO_MINUTOS,
    PERIODOS_ATENDIMENTO,
    formatarDataLocal,
    calcularHorariosOcupados,
    validarHorarioAgendamento
};
