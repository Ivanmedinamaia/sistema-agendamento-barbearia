import { BrowserRouter, Link, Route, Routes } from 'react-router';
import { AuthProvider } from './contexto/AuthContext';
import Layout from './componentes/Layout';
import RotaProtegida from './componentes/RotaProtegida';

import Inicio from './paginas/Inicio';
import Login from './paginas/Login';
import Cadastro from './paginas/Cadastro';
import EsqueciSenha from './paginas/EsqueciSenha';
import RedefinirSenha from './paginas/RedefinirSenha';
import Agendar from './paginas/Agendar';
import MeusAgendamentos from './paginas/MeusAgendamentos';
import AdminAgendamentos from './paginas/admin/AdminAgendamentos';
import AdminServicos from './paginas/admin/AdminServicos';
import AdminBarbeiros from './paginas/admin/AdminBarbeiros';

function NaoEncontrada() {
    return (
        <section className="pagina-centro">
            <h1>Página não encontrada</h1>
            <p className="texto-suave">O endereço acessado não existe.</p>
            <Link to="/" className="botao">Voltar ao início</Link>
        </section>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route element={<Layout />}>
                        <Route index element={<Inicio />} />
                        <Route path="login" element={<Login />} />
                        <Route path="cadastro" element={<Cadastro />} />
                        <Route path="esqueci-senha" element={<EsqueciSenha />} />
                        <Route path="redefinir-senha" element={<RedefinirSenha />} />

                        <Route path="agendar" element={<RotaProtegida><Agendar /></RotaProtegida>} />
                        <Route path="agendar/:id" element={<RotaProtegida><Agendar /></RotaProtegida>} />
                        <Route
                            path="meus-agendamentos"
                            element={<RotaProtegida><MeusAgendamentos /></RotaProtegida>}
                        />

                        <Route
                            path="admin/agendamentos"
                            element={<RotaProtegida somenteAdmin><AdminAgendamentos /></RotaProtegida>}
                        />
                        <Route
                            path="admin/servicos"
                            element={<RotaProtegida somenteAdmin><AdminServicos /></RotaProtegida>}
                        />
                        <Route
                            path="admin/barbeiros"
                            element={<RotaProtegida somenteAdmin><AdminBarbeiros /></RotaProtegida>}
                        />

                        <Route path="*" element={<NaoEncontrada />} />
                    </Route>
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
