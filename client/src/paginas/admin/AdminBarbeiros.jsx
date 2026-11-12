import { useState } from 'react';
import { useConsulta } from '../../hooks/useConsulta';
import { api } from '../../servicos/api';
import { Aviso, BotaoConfirmar, Carregando } from '../../componentes/Interface';

const FORMULARIO_VAZIO = { nome: '', especialidade: '', telefone: '', email: '' };

// Cadastro, edição e desativação de barbeiros
export default function AdminBarbeiros() {
    const lista = useConsulta('/barbeiros');

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

    const editar = (barbeiro) => {
        setEditandoId(barbeiro._id);
        setForm({
            nome: barbeiro.nome,
            especialidade: barbeiro.especialidade,
            telefone: barbeiro.telefone ?? '',
            email: barbeiro.email ?? ''
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
            especialidade: form.especialidade.trim(),
            telefone: form.telefone.trim(),
            email: form.email.trim()
        };

        try {
            if (editandoId) {
                await api.put(`/barbeiros/${editandoId}`, corpo);
                setAviso('Barbeiro atualizado.');
            } else {
                await api.post('/barbeiros', corpo);
                setAviso('Barbeiro cadastrado.');
            }

            limparFormulario();
            lista.recarregar();
        } catch (e) {
            setErro(e.message);
        } finally {
            setEnviando(false);
        }
    };

    const desativar = async (barbeiro) => {
        setErro('');
        setAviso('');

        try {
            await api.patch(`/barbeiros/${barbeiro._id}/desativar`);
            setAviso(`${barbeiro.nome} foi desativado e não aparece mais para agendamento.`);

            if (editandoId === barbeiro._id) {
                limparFormulario();
            }

            lista.recarregar();
        } catch (e) {
            setErro(e.message);
        }
    };

    const barbeiros = lista.dados?.barbeiros ?? [];

    return (
        <>
            <div className="cabecalho-pagina">
                <div>
                    <h1>Barbeiros</h1>
                    <p className="texto-suave">Profissionais disponíveis para agendamento.</p>
                </div>
            </div>

            <Aviso tipo="sucesso" aoFechar={() => setAviso('')}>{aviso}</Aviso>
            <Aviso tipo="erro">{erro || lista.erro}</Aviso>

            <div className="painel-admin">
                <div className="cartao">
                    <h2>{editandoId ? 'Editar barbeiro' : 'Novo barbeiro'}</h2>

                    <form className="formulario" onSubmit={salvar}>
                        <div className="campo">
                            <label htmlFor="nome">Nome</label>
                            <input id="nome" required minLength={3} value={form.nome} onChange={alterar('nome')} />
                        </div>

                        <div className="campo">
                            <label htmlFor="especialidade">Especialidade</label>
                            <input
                                id="especialidade"
                                required
                                minLength={3}
                                placeholder="Ex.: cortes clássicos e barba"
                                value={form.especialidade}
                                onChange={alterar('especialidade')}
                            />
                        </div>

                        <div className="campo">
                            <label htmlFor="telefone">Telefone</label>
                            <input
                                id="telefone"
                                type="tel"
                                required
                                minLength={10}
                                maxLength={15}
                                placeholder="Ex.: 95991234567"
                                value={form.telefone}
                                onChange={alterar('telefone')}
                            />
                        </div>

                        <div className="campo">
                            <label htmlFor="email">E-mail</label>
                            <input id="email" type="email" required value={form.email} onChange={alterar('email')} />
                        </div>

                        <div className="acoes">
                            <button type="submit" className="botao" disabled={enviando}>
                                {enviando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Cadastrar barbeiro'}
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

                    {lista.dados && barbeiros.length === 0 && (
                        <p className="vazio">Nenhum barbeiro cadastrado. Use o formulário para cadastrar o primeiro.</p>
                    )}

                    {barbeiros.length > 0 && (
                        <div className="tabela-container">
                            <table className="tabela">
                                <thead>
                                    <tr>
                                        <th>Barbeiro</th>
                                        <th>Contato</th>
                                        <th><span className="sr-only">Ações</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {barbeiros.map((barbeiro) => (
                                        <tr key={barbeiro._id}>
                                            <td>
                                                {barbeiro.nome}
                                                <span className="secundario">{barbeiro.especialidade}</span>
                                            </td>
                                            <td>
                                                {barbeiro.telefone}
                                                <span className="secundario">{barbeiro.email}</span>
                                            </td>
                                            <td>
                                                <div className="acoes">
                                                    <button
                                                        type="button"
                                                        className="botao botao-secundario botao-pequeno"
                                                        onClick={() => editar(barbeiro)}
                                                    >
                                                        Editar
                                                    </button>
                                                    <BotaoConfirmar
                                                        pergunta="Desativar?"
                                                        aoConfirmar={() => desativar(barbeiro)}
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
