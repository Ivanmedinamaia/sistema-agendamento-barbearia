import { useState } from 'react';
import { Link } from 'react-router';
import { api } from '../servicos/api';
import { Aviso } from '../componentes/Interface';

// Pede o email e envia um link para criar uma nova senha
export default function EsqueciSenha() {
    const [email, setEmail] = useState('');
    const [erro, setErro] = useState('');
    const [enviado, setEnviado] = useState('');
    const [enviando, setEnviando] = useState(false);

    const aoEnviar = async (evento) => {
        evento.preventDefault();
        setErro('');
        setEnviando(true);

        try {
            const resposta = await api.post('/usuarios/esqueci-senha', { email: email.trim() });
            setEnviado(resposta.mensagem);
        } catch (e) {
            setErro(e.message);
        } finally {
            setEnviando(false);
        }
    };

    return (
        <section className="autenticacao">
            <h1>Esqueci minha senha</h1>
            <p className="texto-suave">
                Informe o email da sua conta. Vamos enviar um link para você criar uma nova senha.
            </p>

            <div className="cartao">
                <Aviso tipo="erro">{erro}</Aviso>

                {enviado ? (
                    <>
                        <Aviso tipo="sucesso">{enviado}</Aviso>
                        <p className="texto-suave">
                            Não recebeu? Confira a caixa de spam ou tente de novo em alguns minutos.
                        </p>
                        <button type="button" className="botao botao-secundario botao-largo" onClick={() => setEnviado('')}>
                            Enviar novamente
                        </button>
                    </>
                ) : (
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

                        <button type="submit" className="botao botao-largo" disabled={enviando}>
                            {enviando ? 'Enviando...' : 'Enviar link'}
                        </button>
                    </form>
                )}
            </div>

            <p className="rodape-formulario">
                Lembrou a senha? <Link to="/login">Entrar</Link>
            </p>
        </section>
    );
}
