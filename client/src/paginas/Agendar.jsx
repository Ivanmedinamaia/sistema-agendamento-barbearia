import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useAuth } from '../contexto/AuthContext';
import { useConsulta } from '../hooks/useConsulta';
import { api } from '../servicos/api';
import { Aviso, Carregando } from '../componentes/Interface';
import {
    diaNaBarbearia,
    ehDomingo,
    formatarDataHora,
    formatarDiaCurto,
    formatarDiaLongo,
    formatarDuracao,
    formatarPreco,
    hojeNaBarbearia,
    proximosDiasUteis
} from '../servicos/formatacao';

// Cabeçalho numerado de cada etapa do agendamento
function Etapa({ numero, titulo, children }) {
    return (
        <section className="etapa" aria-labelledby={`etapa-${numero}`}>
            <div className="etapa-titulo">
                <span className="etapa-numero" aria-hidden="true">{numero}</span>
                <h2 id={`etapa-${numero}`}>{titulo}</h2>
            </div>
            {children}
        </section>
    );
}

// Cria um novo agendamento ou, com um ID na URL, remarca um existente
export default function Agendar() {
    const { id } = useParams();
    const editando = Boolean(id);
    const { ehAdmin } = useAuth();
    const navigate = useNavigate();

    const servicos = useConsulta('/servicos');
    const barbeiros = useConsulta('/barbeiros');
    const existente = useConsulta(editando ? `/agendamentos/${id}` : null);
    const agendamentoAtual = existente.dados?.agendamento;

    const [escolha, setEscolha] = useState({ servico: '', barbeiro: '', data: '' });
    const [horario, setHorario] = useState(null);
    const [erroEnvio, setErroEnvio] = useState('');
    const [enviando, setEnviando] = useState(false);

    // Na remarcação, começa com os dados do agendamento atual
    useEffect(() => {
        if (agendamentoAtual) {
            setEscolha({
                servico: agendamentoAtual.servico?._id ?? '',
                barbeiro: agendamentoAtual.barbeiro?._id ?? '',
                data: diaNaBarbearia(agendamentoAtual.dataHora)
            });
        }
    }, [agendamentoAtual]);

    // Busca os horários livres quando serviço, barbeiro e data estão escolhidos
    const domingo = Boolean(escolha.data) && ehDomingo(escolha.data);
    const podeConsultar = escolha.servico && escolha.barbeiro && escolha.data && !domingo;
    const parametros = new URLSearchParams(escolha);

    // Na remarcação, o horário atual do próprio agendamento conta como livre
    if (editando) {
        parametros.set('ignorar', id);
    }

    const disponibilidade = useConsulta(
        podeConsultar ? `/agendamentos/disponibilidade?${parametros}` : null
    );

    // Qualquer mudança de escolha invalida o horário selecionado
    const escolher = (campo, valor) => {
        setEscolha((anterior) => ({ ...anterior, [campo]: valor }));
        setHorario(null);
        setErroEnvio('');
    };

    const confirmar = async () => {
        setEnviando(true);
        setErroEnvio('');

        const corpo = {
            servico: escolha.servico,
            barbeiro: escolha.barbeiro,
            dataHora: horario.dataHora
        };

        try {
            if (editando) {
                await api.patch(`/agendamentos/${id}`, corpo);
            } else {
                await api.post('/agendamentos', corpo);
            }

            navigate(ehAdmin ? '/admin/agendamentos' : '/meus-agendamentos', {
                state: {
                    aviso: editando
                        ? 'Agendamento remarcado com sucesso.'
                        : 'Agendamento realizado com sucesso!'
                }
            });
        } catch (e) {
            setErroEnvio(e.message);
            setEnviando(false);

            // Alguém reservou o horário antes: atualiza a lista
            if (e.status === 409) {
                setHorario(null);
                disponibilidade.recarregar();
            }
        }
    };

    if (servicos.carregando || barbeiros.carregando || existente.carregando) {
        return <Carregando />;
    }

    const erroCarga = servicos.erro || barbeiros.erro || existente.erro;

    if (erroCarga) {
        return <Aviso tipo="erro">{erroCarga}</Aviso>;
    }

    if (editando && agendamentoAtual?.status !== 'agendado') {
        return (
            <>
                <Aviso tipo="erro">Este agendamento não pode mais ser remarcado.</Aviso>
                <Link to="/meus-agendamentos" className="botao botao-secundario">Voltar</Link>
            </>
        );
    }

    const listaServicos = servicos.dados.servicos;
    const listaBarbeiros = barbeiros.dados.barbeiros;
    const servicoEscolhido = listaServicos.find((s) => s._id === escolha.servico);
    const barbeiroEscolhido = listaBarbeiros.find((b) => b._id === escolha.barbeiro);

    const dias = proximosDiasUteis(6);
    const horariosLivres = disponibilidade.dados?.horariosDisponiveis ?? [];
    const turnos = [
        { nome: 'Manhã', horarios: horariosLivres.filter((h) => h.horario < '12:00') },
        { nome: 'Tarde', horarios: horariosLivres.filter((h) => h.horario >= '12:00') }
    ].filter((turno) => turno.horarios.length > 0);

    return (
        <>
            <div className="cabecalho-pagina">
                <div>
                    <h1>{editando ? 'Remarcar horário' : 'Agendar horário'}</h1>
                    <p className="texto-suave">
                        {editando
                            ? `Horário atual: ${formatarDataHora(agendamentoAtual.dataHora)}`
                            : 'Escolha o serviço, o barbeiro e o melhor horário para você.'}
                    </p>
                </div>
            </div>

            {(listaServicos.length === 0 || listaBarbeiros.length === 0) && (
                <p className="vazio">
                    A barbearia ainda não cadastrou serviços ou barbeiros. Tente novamente mais tarde.
                </p>
            )}

            <Etapa numero={1} titulo="Serviço">
                <div className="grade">
                    {listaServicos.map((servico) => (
                        <button
                            key={servico._id}
                            type="button"
                            className="opcao"
                            aria-pressed={escolha.servico === servico._id}
                            onClick={() => escolher('servico', servico._id)}
                        >
                            <strong>{servico.nome}</strong>
                            <span>
                                {formatarDuracao(servico.duracaoMinutos)} · {formatarPreco(servico.preco)}
                            </span>
                        </button>
                    ))}
                </div>
            </Etapa>

            <Etapa numero={2} titulo="Barbeiro">
                <div className="grade">
                    {listaBarbeiros.map((barbeiro) => (
                        <button
                            key={barbeiro._id}
                            type="button"
                            className="opcao"
                            aria-pressed={escolha.barbeiro === barbeiro._id}
                            onClick={() => escolher('barbeiro', barbeiro._id)}
                        >
                            <strong>{barbeiro.nome}</strong>
                            <span>{barbeiro.especialidade}</span>
                        </button>
                    ))}
                </div>
            </Etapa>

            <Etapa numero={3} titulo="Dia">
                <div className="dias">
                    {dias.map((dia, indice) => (
                        <button
                            key={dia}
                            type="button"
                            className="chip"
                            aria-pressed={escolha.data === dia}
                            onClick={() => escolher('data', dia)}
                        >
                            {indice === 0 && dia === hojeNaBarbearia() ? 'Hoje' : formatarDiaCurto(dia)}
                        </button>
                    ))}
                    <label className="outra-data">
                        ou outra data
                        <input
                            type="date"
                            min={hojeNaBarbearia()}
                            value={escolha.data}
                            onChange={(e) => escolher('data', e.target.value)}
                        />
                    </label>
                </div>
            </Etapa>

            <Etapa numero={4} titulo="Horário">
                {!podeConsultar && !domingo && (
                    <p className="texto-suave">Escolha o serviço, o barbeiro e o dia para ver os horários livres.</p>
                )}

                {domingo && <Aviso tipo="info">A barbearia não funciona aos domingos. Escolha outro dia.</Aviso>}

                {podeConsultar && (
                    <>
                        <p className="texto-suave">
                            Horários livres de {barbeiroEscolhido?.nome} em {formatarDiaLongo(escolha.data)}:
                        </p>

                        {disponibilidade.carregando && !disponibilidade.dados && <Carregando texto="Buscando horários..." />}
                        <Aviso tipo="erro">{disponibilidade.erro}</Aviso>

                        {disponibilidade.dados && horariosLivres.length === 0 && (
                            <p className="vazio">Nenhum horário livre neste dia. Tente outro dia ou outro barbeiro.</p>
                        )}

                        {turnos.map((turno) => (
                            <div key={turno.nome} className="turno">
                                <h3>{turno.nome}</h3>
                                <div className="horarios">
                                    {turno.horarios.map((h) => (
                                        <button
                                            key={h.dataHora}
                                            type="button"
                                            className="horario"
                                            aria-pressed={horario?.dataHora === h.dataHora}
                                            disabled={disponibilidade.carregando}
                                            onClick={() => {
                                                setHorario(h);
                                                setErroEnvio('');
                                            }}
                                        >
                                            {h.horario}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </Etapa>

            <Aviso tipo="erro">{erroEnvio}</Aviso>

            {horario && servicoEscolhido && (
                <div className="resumo" aria-live="polite">
                    <p>
                        <strong>{servicoEscolhido.nome}</strong> com <strong>{barbeiroEscolhido?.nome}</strong>
                        <br />
                        {formatarDiaLongo(escolha.data)} às <strong>{horario.horario}</strong> ·{' '}
                        {formatarPreco(servicoEscolhido.preco)}
                    </p>
                    <button type="button" className="botao botao-grande" disabled={enviando} onClick={confirmar}>
                        {enviando ? 'Confirmando...' : editando ? 'Confirmar remarcação' : 'Confirmar agendamento'}
                    </button>
                </div>
            )}
        </>
    );
}
