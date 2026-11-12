import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useConsulta } from '../../hooks/useConsulta';
import { api } from '../../servicos/api';
import { Abas, Aviso, BotaoConfirmar, Carregando, Paginacao, StatusAgendamento } from '../../componentes/Interface';
import { formatarDataHora } from '../../servicos/formatacao';

const PERIODOS = [
    { valor: 'proximos', rotulo: 'Próximos' },
    { valor: 'anteriores', rotulo: 'Anteriores' },
    { valor: 'todos', rotulo: 'Todos' }
];

// Agenda completa da barbearia, com filtros e ações do administrador
export default function AdminAgendamentos() {
    const location = useLocation();
    const navigate = useNavigate();

    const [aviso, setAviso] = useState(location.state?.aviso ?? '');
    const [erro, setErro] = useState('');
    const [periodo, setPeriodo] = useState('proximos');
    const [status, setStatus] = useState('');
    const [pagina, setPagina] = useState(1);

    const parametros = new URLSearchParams({ pagina, limite: 20 });
    if (periodo !== 'todos') parametros.set('periodo', periodo);
    if (status) parametros.set('status', status);

    const lista = useConsulta(`/agendamentos?${parametros}`);

    useEffect(() => {
        if (location.state?.aviso) {
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.state, location.pathname, navigate]);

    // Executa uma ação sobre um agendamento e atualiza a lista
    const executar = async (caminho, mensagem) => {
        setErro('');
        setAviso('');

        try {
            await api.patch(caminho);
            setAviso(mensagem);
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
                    <h1>Agendamentos</h1>
                    <p className="texto-suave">
                        {lista.dados ? `${lista.dados.total} agendamento(s) encontrado(s)` : 'Agenda da barbearia'}
                    </p>
                </div>
                <Link to="/agendar" className="botao">Novo agendamento</Link>
            </div>

            <Aviso tipo="sucesso" aoFechar={() => setAviso('')}>{aviso}</Aviso>
            <Aviso tipo="erro">{erro || lista.erro}</Aviso>

            <div className="filtros">
                <Abas
                    opcoes={PERIODOS}
                    valor={periodo}
                    aoMudar={(valor) => {
                        setPeriodo(valor);
                        setPagina(1);
                    }}
                />
                <div className="campo">
                    <label htmlFor="filtro-status">Status</label>
                    <select
                        id="filtro-status"
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setPagina(1);
                        }}
                    >
                        <option value="">Todos</option>
                        <option value="agendado">Agendado</option>
                        <option value="concluido">Concluído</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>
            </div>

            {lista.carregando && !lista.dados && <Carregando />}

            {lista.dados && agendamentos.length === 0 && (
                <p className="vazio">Nenhum agendamento encontrado com esses filtros.</p>
            )}

            {agendamentos.length > 0 && (
                <div className="tabela-container">
                    <table className="tabela">
                        <thead>
                            <tr>
                                <th>Data e hora</th>
                                <th>Cliente</th>
                                <th>Serviço</th>
                                <th>Barbeiro</th>
                                <th>Status</th>
                                <th><span className="sr-only">Ações</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {agendamentos.map((agendamento) => {
                                const ativo = agendamento.status === 'agendado';
                                const jaComecou = new Date(agendamento.dataHora) <= agora;

                                return (
                                    <tr key={agendamento._id}>
                                        <td className="coluna-numero">{formatarDataHora(agendamento.dataHora)}</td>
                                        <td>
                                            {agendamento.usuario?.nome ?? 'Usuário removido'}
                                            <span className="secundario">{agendamento.usuario?.email}</span>
                                        </td>
                                        <td>{agendamento.servico?.nome ?? '-'}</td>
                                        <td>{agendamento.barbeiro?.nome ?? '-'}</td>
                                        <td><StatusAgendamento status={agendamento.status} /></td>
                                        <td>
                                            {ativo && (
                                                <div className="acoes">
                                                    {jaComecou ? (
                                                        <button
                                                            type="button"
                                                            className="botao botao-pequeno"
                                                            onClick={() =>
                                                                executar(
                                                                    `/agendamentos/${agendamento._id}/concluir`,
                                                                    'Atendimento marcado como concluído.'
                                                                )
                                                            }
                                                        >
                                                            Concluir
                                                        </button>
                                                    ) : (
                                                        <Link
                                                            to={`/agendar/${agendamento._id}`}
                                                            className="botao botao-secundario botao-pequeno"
                                                        >
                                                            Remarcar
                                                        </Link>
                                                    )}
                                                    <BotaoConfirmar
                                                        pergunta="Cancelar?"
                                                        aoConfirmar={() =>
                                                            executar(
                                                                `/agendamentos/${agendamento._id}/cancelar`,
                                                                'Agendamento cancelado.'
                                                            )
                                                        }
                                                    >
                                                        Cancelar
                                                    </BotaoConfirmar>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <Paginacao pagina={pagina} totalPaginas={lista.dados?.totalPaginas} aoMudar={setPagina} />
        </>
    );
}
