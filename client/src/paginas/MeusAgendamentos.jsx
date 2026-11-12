import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useConsulta } from '../hooks/useConsulta';
import { api } from '../servicos/api';
import { Abas, Aviso, BotaoConfirmar, Carregando, Paginacao, StatusAgendamento } from '../componentes/Interface';
import {
    diaNaBarbearia,
    formatarDiaCurto,
    formatarDuracao,
    formatarHora,
    formatarPreco
} from '../servicos/formatacao';

const PERIODOS = [
    { valor: 'proximos', rotulo: 'Próximos' },
    { valor: 'anteriores', rotulo: 'Histórico' }
];

export default function MeusAgendamentos() {
    const location = useLocation();
    const navigate = useNavigate();

    // Mensagem vinda da tela de agendamento (ex.: "Agendamento realizado")
    const [aviso, setAviso] = useState(location.state?.aviso ?? '');
    const [erro, setErro] = useState('');
    const [periodo, setPeriodo] = useState('proximos');
    const [pagina, setPagina] = useState(1);

    const lista = useConsulta(`/agendamentos?periodo=${periodo}&pagina=${pagina}&limite=10`);

    // Remove a mensagem do histórico para ela não reaparecer ao recarregar a página
    useEffect(() => {
        if (location.state?.aviso) {
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.state, location.pathname, navigate]);

    const mudarPeriodo = (valor) => {
        setPeriodo(valor);
        setPagina(1);
    };

    const cancelar = async (agendamento) => {
        setErro('');
        setAviso('');

        try {
            await api.patch(`/agendamentos/${agendamento._id}/cancelar`);
            setAviso('Agendamento cancelado.');
            lista.recarregar();
        } catch (e) {
            setErro(e.message);
        }
    };

    const agendamentos = lista.dados?.agendamentos ?? [];
    const agora = new Date();

    return (
        <>
            <div className="cabecalho-pagina">
                <div>
                    <h1>Meus agendamentos</h1>
                    <p className="texto-suave">Acompanhe, remarque ou cancele seus horários.</p>
                </div>
                <Link to="/agendar" className="botao">Novo agendamento</Link>
            </div>

            <Aviso tipo="sucesso" aoFechar={() => setAviso('')}>{aviso}</Aviso>
            <Aviso tipo="erro">{erro || lista.erro}</Aviso>

            <Abas opcoes={PERIODOS} valor={periodo} aoMudar={mudarPeriodo} />

            {lista.carregando && !lista.dados && <Carregando />}

            {lista.dados && agendamentos.length === 0 && (
                <div className="vazio">
                    {periodo === 'proximos' ? (
                        <>
                            <p>Você não tem agendamentos futuros.</p>
                            <Link to="/agendar" className="botao">Agendar agora</Link>
                        </>
                    ) : (
                        <p>Nenhum atendimento anterior.</p>
                    )}
                </div>
            )}

            <div className="lista-agendamentos">
                {agendamentos.map((agendamento) => {
                    const podeAlterar =
                        agendamento.status === 'agendado' && new Date(agendamento.dataHora) > agora;

                    return (
                        <article key={agendamento._id} className="cartao agendamento">
                            <div className="agendamento-data">
                                <span className="dia">
                                    {formatarDiaCurto(diaNaBarbearia(agendamento.dataHora))}
                                </span>
                                <span className="hora">{formatarHora(agendamento.dataHora)}</span>
                            </div>

                            <div className="agendamento-info">
                                <h3>{agendamento.servico?.nome ?? 'Serviço removido'}</h3>
                                <p>
                                    com {agendamento.barbeiro?.nome ?? 'barbeiro removido'}
                                    {agendamento.servico &&
                                        ` · ${formatarDuracao(agendamento.servico.duracaoMinutos)} · ${formatarPreco(agendamento.servico.preco)}`}
                                </p>
                            </div>

                            <div className="agendamento-acoes">
                                <StatusAgendamento status={agendamento.status} />
                                {podeAlterar && (
                                    <div className="acoes">
                                        <Link
                                            to={`/agendar/${agendamento._id}`}
                                            className="botao botao-secundario botao-pequeno"
                                        >
                                            Remarcar
                                        </Link>
                                        <BotaoConfirmar
                                            pergunta="Cancelar?"
                                            textoConfirmar="Sim, cancelar"
                                            aoConfirmar={() => cancelar(agendamento)}
                                        >
                                            Cancelar
                                        </BotaoConfirmar>
                                    </div>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>

            <Paginacao pagina={pagina} totalPaginas={lista.dados?.totalPaginas} aoMudar={setPagina} />
        </>
    );
}
