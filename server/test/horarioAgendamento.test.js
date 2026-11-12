// Testes das regras de horário de agendamento
// Execute com: npm test

const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
    calcularHorariosOcupados,
    validarHorarioAgendamento
} = require('../src/utils/horarioAgendamento');

// Boa Vista fica em UTC-4 (sem horário de verão)
const local = (dataHora) => new Date(`${dataHora}-04:00`);

// Data de referência: segunda-feira, 2026-11-09 às 07:00 em Boa Vista
const AGORA = local('2026-11-09T07:00:00');

test('aceita um horário válido e calcula os dados do atendimento', () => {
    const resultado = validarHorarioAgendamento(local('2026-11-09T09:20:00'), 30, AGORA);

    assert.equal(resultado.erro, undefined);
    assert.deepEqual(resultado.dataHoraFim, local('2026-11-09T09:50:00'));
    assert.deepEqual(resultado.inicioDia, local('2026-11-09T00:00:00'));
    assert.deepEqual(resultado.horariosOcupados, [
        local('2026-11-09T09:20:00'),
        local('2026-11-09T09:40:00')
    ]);
});

test('recusa datas no passado e datas inválidas', () => {
    assert.match(validarHorarioAgendamento(local('2026-11-09T06:40:00'), 30, AGORA).erro, /passados/);
    assert.match(validarHorarioAgendamento(new Date('invalida'), 30, AGORA).erro, /inválidos/);
});

test('recusa horários fora do intervalo de 20 minutos', () => {
    assert.match(validarHorarioAgendamento(local('2026-11-09T09:10:00'), 30, AGORA).erro, /20 minutos/);
});

test('recusa domingos', () => {
    assert.match(validarHorarioAgendamento(local('2026-11-15T09:00:00'), 30, AGORA).erro, /domingos/);
});

test('recusa atendimentos fora do expediente', () => {
    assert.match(validarHorarioAgendamento(local('2026-11-09T07:40:00'), 20, local('2026-11-09T06:00:00')).erro, /08h e 18h/);
    assert.match(validarHorarioAgendamento(local('2026-11-09T17:40:00'), 40, AGORA).erro, /08h e 18h/);
});

test('recusa atendimento que passa da meia-noite', () => {
    // Antes da correção, o fim (00:20 do dia seguinte) era lido como 20 minutos
    // após a meia-noite e o agendamento era aceito.
    assert.match(validarHorarioAgendamento(local('2026-11-09T17:40:00'), 400, AGORA).erro, /08h e 18h/);
});

test('recusa atendimentos que invadem o almoço', () => {
    assert.match(validarHorarioAgendamento(local('2026-11-09T11:40:00'), 40, AGORA).erro, /12h e 13h/);
    assert.equal(validarHorarioAgendamento(local('2026-11-09T11:40:00'), 20, AGORA).erro, undefined);
    assert.equal(validarHorarioAgendamento(local('2026-11-09T13:00:00'), 60, AGORA).erro, undefined);
});

test('blocos ocupados arredondam a duração para múltiplos de 20 minutos', () => {
    const inicio = local('2026-11-09T08:00:00');

    assert.equal(calcularHorariosOcupados(inicio, 20).length, 1);
    assert.equal(calcularHorariosOcupados(inicio, 21).length, 2);
    assert.equal(calcularHorariosOcupados(inicio, 45).length, 3);
    assert.equal(calcularHorariosOcupados(inicio, 60).length, 3);
});
