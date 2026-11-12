import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { useAuth } from '../contexto/AuthContext';
import { Aviso } from '../componentes/Interface';

export default function Login() {
    const { usuario, ehAdmin, entrar, avisoSessao } = useAuth();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [enviando, setEnviando] = useState(false);

    // Depois do login, volta para a página pedida ou vai para a página principal do perfil
    if (usuario) {
        const destinoPadrao = ehAdmin ? '/admin/agendamentos' : '/meus-agendamentos';
        return <Navigate to={location.state?.de || destinoPadrao} replace />;
    }

    const aoEnviar = async (evento) => {
        evento.preventDefault();
        setErro('');
        setEnviando(true);

        try {
            await entrar(email, senha);
        } catch (e) {
            setErro(e.message);
            setEnviando(false);
        }
    };

    return (
        <section className="autenticacao">
            <h1>Entrar</h1>
            <p className="texto-suave">Acesse sua conta para agendar e acompanhar seus horários.</p>

            <div className="cartao">
                <Aviso tipo="info">{avisoSessao}</Aviso>
                <Aviso tipo="erro">{erro}</Aviso>

                <form className="formulario" onSubmit={aoEnviar}>
                    <div className="campo">
                        <label htmlFor="email">E-mail</label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="campo">
                        <label htmlFor="senha">Senha</label>
                        <input
                            id="senha"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="botao botao-largo" disabled={enviando}>
                        {enviando ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>

            <p className="rodape-formulario">
                Ainda não tem conta? <Link to="/cadastro" state={location.state}>Criar conta</Link>
            </p>
        </section>
    );
}
