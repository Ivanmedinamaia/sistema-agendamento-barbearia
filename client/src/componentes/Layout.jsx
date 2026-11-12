import { startTransition, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../contexto/AuthContext';

// Estrutura comum a todas as páginas: cabeçalho, conteúdo e rodapé
export default function Layout() {
    const { usuario, ehAdmin, sair } = useAuth();
    const navigate = useNavigate();

    // O tema inicial já foi aplicado por index.html; aqui só alternamos e salvamos
    const [tema, setTema] = useState(() => document.documentElement.dataset.tema || 'claro');
    const escuro = tema === 'escuro';

    const alternarTema = () => {
        const novo = escuro ? 'claro' : 'escuro';
        document.documentElement.dataset.tema = novo;
        try {
            localStorage.setItem('tema', novo);
        } catch {
            // Sem armazenamento (ex.: navegação privada), o tema vale só nesta visita
        }
        setTema(novo);
    };

    // Sai da conta e vai para o início na mesma atualização. Assim a página
    // protegida atual não chega a redirecionar para o login guardando a si
    // mesma como destino do próximo login.
    const aoSair = () => {
        startTransition(() => {
            navigate('/');
            sair();
        });
    };

    return (
        <>
            <header className="topo">
                <div className="topo-conteudo">
                    <Link to="/" className="marca">
                        <span className="marca-icone" aria-hidden="true">✂</span>
                        Barbearia
                    </Link>

                    <nav className="menu" aria-label="Navegação principal">
                        <button
                            type="button"
                            className="botao-tema"
                            onClick={alternarTema}
                            aria-label={escuro ? 'Ativar modo claro' : 'Ativar modo escuro'}
                            title={escuro ? 'Modo claro' : 'Modo escuro'}
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {escuro ? (
                                    <>
                                        <circle cx="12" cy="12" r="4" />
                                        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                                    </>
                                ) : (
                                    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
                                )}
                            </svg>
                        </button>

                        {!usuario && (
                            <>
                                <NavLink to="/login">Entrar</NavLink>
                                <NavLink to="/cadastro" className="botao botao-pequeno">
                                    Criar conta
                                </NavLink>
                            </>
                        )}

                        {usuario && !ehAdmin && (
                            <>
                                <NavLink to="/agendar">Agendar</NavLink>
                                <NavLink to="/meus-agendamentos">Meus agendamentos</NavLink>
                            </>
                        )}

                        {ehAdmin && (
                            <>
                                <NavLink to="/admin/agendamentos">Agendamentos</NavLink>
                                <NavLink to="/admin/servicos">Serviços</NavLink>
                                <NavLink to="/admin/barbeiros">Barbeiros</NavLink>
                            </>
                        )}

                        {usuario && (
                            <div className="menu-usuario">
                                <span className="menu-nome">{usuario.nome.split(' ')[0]}</span>
                                <button type="button" className="botao-link" onClick={aoSair}>
                                    Sair
                                </button>
                            </div>
                        )}
                    </nav>
                </div>
            </header>

            <main className="conteudo">
                <Outlet />
            </main>

            <footer className="rodape">
                Segunda a sábado, das 08h às 18h · Intervalo de almoço das 12h às 13h
            </footer>
        </>
    );
}
