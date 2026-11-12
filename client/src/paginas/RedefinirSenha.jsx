import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { api } from '../servicos/api';
import { Aviso } from '../componentes/Interface';

// Cria a nova senha a partir do link recebido por email (/redefinir-senha?token=...)
export default function RedefinirSenha() {
    const [parametros] = useSearchParams();
    const token = parametros.get('token') ?? '';
    const navigate = useNavigate();

    const [senha, setSenha] = useState('');
    const [confirmacao, setConfirmacao] = useState('');
    const [erro, setErro] = useState('');
    const [enviando, setEnviando] = useState(false);

    const aoEnviar = async (evento) => {
        evento.preventDefault();
        setErro('');

        if (senha.length < 8) {
            setErro('A senha deve ter pelo menos 8 caracteres.');
            return;
        }

        if (senha !== confirmacao) {
            setErro('As senhas não conferem.');
            return;
        }

        setEnviando(true);

        try {
            const resposta = await api.post('/usuarios/redefinir-senha', { token, senha });
            navigate('/login', { replace: true, state: { aviso: resposta.mensagem } });
        } catch (e) {
            setErro(e.message);
            setEnviando(false);
        }
    };

    if (!token) {
        return (
            <section className="autenticacao">
                <h1>Link inválido</h1>
                <div className="cartao">
                    <Aviso tipo="erro">Este endereço não tem um link de recuperação válido.</Aviso>
                    <Link to="/esqueci-senha" className="botao botao-largo">Pedir um novo link</Link>
                </div>
            </section>
        );
    }

    return (
        <section className="autenticacao">
            <h1>Criar nova senha</h1>
            <p className="texto-suave">Escolha uma nova senha para a sua conta.</p>

            <div className="cartao">
                {erro && (
                    <Aviso tipo="erro">
                        {erro}{' '}
                        {/expirou|inválido/i.test(erro) && <Link to="/esqueci-senha">Pedir um novo link</Link>}
                    </Aviso>
                )}

                <form className="formulario" onSubmit={aoEnviar}>
                    <div className="campo">
                        <label htmlFor="senha">Nova senha</label>
                        <input
                            id="senha"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                        />
                        <span className="campo-ajuda">Mínimo de 8 caracteres.</span>
                    </div>

                    <div className="campo">
                        <label htmlFor="confirmacao">Confirme a nova senha</label>
                        <input
                            id="confirmacao"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={confirmacao}
                            onChange={(e) => setConfirmacao(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="botao botao-largo" disabled={enviando}>
                        {enviando ? 'Salvando...' : 'Salvar nova senha'}
                    </button>
                </form>
            </div>
        </section>
    );
}
