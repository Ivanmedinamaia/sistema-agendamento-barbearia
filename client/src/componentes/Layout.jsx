import { startTransition } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../contexto/AuthContext';

// Estrutura comum a todas as páginas: cabeçalho, conteúdo e rodapé
export default function Layout() {
    const { usuario, ehAdmin, sair } = useAuth();
    const navigate = useNavigate();

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
