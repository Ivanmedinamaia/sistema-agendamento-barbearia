// Funções de data e formatação, sempre no fuso horário da barbearia

export const FUSO_HORARIO = 'America/Boa_Vista';

// Converte uma data para o formato YYYY-MM-DD no fuso da barbearia
const formatoDiaIso = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO_HORARIO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

export const diaNaBarbearia = (data) => formatoDiaIso.format(new Date(data));

export const hojeNaBarbearia = () => diaNaBarbearia(new Date());

// Cria uma data ao meio-dia UTC a partir de YYYY-MM-DD (evita trocar de dia ao formatar)
const meioDia = (dia) => new Date(`${dia}T12:00:00Z`);

export const ehDomingo = (dia) => meioDia(dia).getUTCDay() === 0;

// Lista os próximos dias de funcionamento (sem domingos), a partir de hoje
export function proximosDiasUteis(quantidade) {
    const dias = [];
    const data = meioDia(hojeNaBarbearia());

    while (dias.length < quantidade) {
        if (data.getUTCDay() !== 0) {
            dias.push(data.toISOString().slice(0, 10));
        }
        data.setUTCDate(data.getUTCDate() + 1);
    }

    return dias;
}

const formatoDataHora = new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO_HORARIO,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
});

const formatoHora = new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO_HORARIO,
    hour: '2-digit',
    minute: '2-digit'
});

const formatoDiaCurto = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
});

const formatoDiaLongo = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long'
});

// Ex.: "sáb., 14 de nov., 09:40"
export const formatarDataHora = (data) => formatoDataHora.format(new Date(data));

// Ex.: "09:40"
export const formatarHora = (data) => formatoHora.format(new Date(data));

// Ex.: "sáb., 14/11" (recebe YYYY-MM-DD)
export const formatarDiaCurto = (dia) => formatoDiaCurto.format(meioDia(dia));

// Ex.: "sábado, 14 de novembro" (recebe YYYY-MM-DD)
export const formatarDiaLongo = (dia) => formatoDiaLongo.format(meioDia(dia));

const formatoPreco = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});

export const formatarPreco = (valor) => formatoPreco.format(valor);

// Ex.: 30 -> "30 min"; 90 -> "1h30"; 60 -> "1h"
export function formatarDuracao(minutos) {
    if (minutos < 60) {
        return `${minutos} min`;
    }

    const resto = minutos % 60;
    return `${Math.floor(minutos / 60)}h${resto ? String(resto).padStart(2, '0') : ''}`;
}
