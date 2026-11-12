import { useState } from 'react';
import { useConsulta } from '../../hooks/useConsulta';
import { api } from '../../servicos/api';
import { Aviso, BotaoConfirmar, Carregando } from '../../componentes/Interface';
import { formatarDuracao, formatarPreco } from '../../servicos/formatacao';

const FORMULARIO_VAZIO = { nome: '', descricao: '', preco: '', duracaoMinutos: '' };

// Cadastro, edição e desativação de serviços
export default function AdminServicos() {
    const lista = useConsulta('/servicos');

    const [form, setForm] = useState(FORMULARIO_VAZIO);
    const [editandoId, setEditandoId] = useState(null);
    const [erro, setErro] = useState('');
    const [aviso, setAviso] = useState('');
    const [enviando, setEnviando] = useState(false);

    const alterar = (campo) => (evento) => setForm({ ...form, [campo]: evento.target.value });

    const limparFormulario = () => {
        setForm(FORMULARIO_VAZIO);
        setEditandoId(null);
    };

    const editar = (servico) => {
        setEditandoId(servico._id);
        setForm({
            nome: servico.nome,
            descricao: servico.descricao,
            preco: String(servico.preco),
            duracaoMinutos: String(servico.duracaoMinutos)
        });
        setErro('');
        setAviso('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const salvar = async (evento) => {
        evento.preventDefault();
        setErro('');
        setAviso('');
        setEnviando(true);

        const corpo = {
            nome: form.nome.trim(),
            descricao: form.descricao.trim(),
            preco: Number(form.preco),
            duracaoMinutos: Number(form.duracaoMinutos)
        };

        try {
            if (editandoId) {
                await api.put(`/servicos/${editandoId}`, corpo);
                setAviso('Serviço atualizado.');
            } else {
                await api.post('/servicos', corpo);
                setAviso('Serviço cadastrado.');
            }

            limparFormulario();
            lista.recarregar();
        } catch (e) {
            setErro(e.message);
        } finally {
            setEnviando(false);
        }
    };

    const desativar = async (servico) => {
        setErro('');
        setAviso('');

        try {
            await api.delete(`/servicos/${servico._id}`);
            setAviso(`Serviço "${servico.nome}" desativado.`);

            if (editandoId === servico._id) {
                limparFormulario();
            }

            lista.recarregar();
        } catch (e) {
            setErro(e.message);
        }
    };

    const servicos = lista.dados?.servicos ?? [];

    return (
        <>
            <div className="cabecalho-pagina">
                <div>
                    <h1>Serviços</h1>
                    <p className="texto-suave">Serviços oferecidos aos clientes no agendamento.</p>
                </div>
            </div>

            <Aviso tipo="sucesso" aoFechar={() => setAviso('')}>{aviso}</Aviso>
            <Aviso tipo="erro">{erro || lista.erro}</Aviso>

            <div className="painel-admin">
                <div className="cartao">
                    <h2>{editandoId ? 'Editar serviço' : 'Novo serviço'}</h2>

                    <form className="formulario" onSubmit={salvar}>
                        <div className="campo">
                            <label htmlFor="nome">Nome</label>
                            <input id="nome" required minLength={3} value={form.nome} onChange={alterar('nome')} />
                        </div>

                        <div className="campo">
                            <label htmlFor="descricao">Descrição</label>
                            <textarea
                                id="descricao"
                                required
                                minLength={5}
                                value={form.descricao}
                                onChange={alterar('descricao')}
                            />
                        </div>

                        <div className="linha-campos">
                            <div className="campo">
                                <label htmlFor="preco">Preço (R$)</label>
                                <input
                                    id="preco"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    value={form.preco}
                                    onChange={alterar('preco')}
                                />
                            </div>

                            <div className="campo">
                                <label htmlFor="duracao">Duração (min)</label>
                                <input
                                    id="duracao"
                                    type="number"
                                    min="5"
                                    step="1"
                                    required
                                    value={form.duracaoMinutos}
                                    onChange={alterar('duracaoMinutos')}
                                />
                            </div>
                        </div>

                        <span className="campo-ajuda">
                            A agenda funciona em blocos de 20 minutos. Durações múltiplas de 20 aproveitam melhor os horários.
                        </span>

                        <div className="acoes">
                            <button type="submit" className="botao" disabled={enviando}>
                                {enviando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Cadastrar serviço'}
                            </button>
                            {editandoId && (
                                <button type="button" className="botao botao-secundario" onClick={limparFormulario}>
                                    Cancelar edição
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div>
                    {lista.carregando && !lista.dados && <Carregando />}

                    {lista.dados && servicos.length === 0 && (
                        <p className="vazio">Nenhum serviço cadastrado. Use o formulário para criar o primeiro.</p>
                    )}

                    {servicos.length > 0 && (
                        <div className="tabela-container">
                            <table className="tabela">
                                <thead>
                                    <tr>
                                        <th>Serviço</th>
                                        <th>Duração</th>
                                        <th>Preço</th>
                                        <th><span className="sr-only">Ações</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {servicos.map((servico) => (
                                        <tr key={servico._id}>
                                            <td>
                                                {servico.nome}
                                                <span className="secundario">{servico.descricao}</span>
                                            </td>
                                            <td className="coluna-numero">{formatarDuracao(servico.duracaoMinutos)}</td>
                                            <td className="coluna-numero">{formatarPreco(servico.preco)}</td>
                                            <td>
                                                <div className="acoes">
                                                    <button
                                                        type="button"
                                                        className="botao botao-secundario botao-pequeno"
                                                        onClick={() => editar(servico)}
                                                    >
                                                        Editar
                                                    </button>
                                                    <BotaoConfirmar
                                                        pergunta="Desativar?"
                                                        aoConfirmar={() => desativar(servico)}
                                                    >
                                                        Desativar
                                                    </BotaoConfirmar>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
