import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { useAuth } from '../contexto/AuthContext';
import { Aviso } from '../componentes/Interface';

export default function Cadastro() {
    const { usuario, cadastrar } = useAuth();
    const location = useLocation();

    const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmacao: '' });
    const [erro, setErro] = useState('');
    const [enviando, setEnviando] = useState(false);

    // Conta criada e login feito: segue para o agendamento
    if (usuario) {
        return <Navigate to={location.state?.de || '/agendar'} replace />;
    }

    const alterar = (campo) => (evento) => setForm({ ...form, [campo]: evento.target.value });

    const aoEnviar = async (evento) => {
        evento.preventDefault();
        setErro('');

        if (form.senha.length < 8) {
            setErro('A senha deve ter pelo menos 8 caracteres.');
            return;
        }

        if (form.senha !== form.confirmacao) {
            setErro('As senhas não conferem.');
            return;
        }

        setEnviando(true);

        try {
            await cadastrar(form.nome.trim(), form.email.trim(), form.senha);
        } catch (e) {
            setErro(e.message);
            setEnviando(false);
        }
    };

    return (
        <section className="autenticacao">
            <h1>Criar conta</h1>
            <p className="texto-suave">Leva menos de um minuto.</p>

            <div className="cartao">
                <Aviso tipo="erro">{erro}</Aviso>

                <form className="formulario" onSubmit={aoEnviar}>
                    <div className="campo">
                        <label htmlFor="nome">Nome</label>
                        <input
                            id="nome"
                            autoComplete="name"
                            required
                            minLength={3}
                            value={form.nome}
                            onChange={alterar('nome')}
                        />
                    </div>

                    <div className="campo">
                        <label htmlFor="email">E-mail</label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={form.email}
                            onChange={alterar('email')}
                        />
                    </div>

                    <div className="campo">
                        <label htmlFor="senha">Senha</label>
                        <input
                            id="senha"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={form.senha}
                            onChange={alterar('senha')}
                        />
                        <span className="campo-ajuda">Mínimo de 8 caracteres.</span>
                    </div>

                    <div className="campo">
                        <label htmlFor="confirmacao">Confirme a senha</label>
                        <input
                            id="confirmacao"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={form.confirmacao}
                            onChange={alterar('confirmacao')}
                        />
                    </div>

                    <button type="submit" className="botao botao-largo" disabled={enviando}>
                        {enviando ? 'Criando conta...' : 'Criar conta'}
                    </button>
                </form>
            </div>

            <p className="rodape-formulario">
                Já tem conta? <Link to="/login" state={location.state}>Entrar</Link>
            </p>
        </section>
    );
}
