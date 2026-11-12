import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../servicos/api';
import { lerSessao, salvarSessao, limparSessao } from '../servicos/sessao';

const AuthContext = createContext(null);

// Disponibiliza o usuário logado e as ações de login, cadastro e logout
export function AuthProvider({ children }) {
    const [sessao, setSessao] = useState(lerSessao);
    const [avisoSessao, setAvisoSessao] = useState('');

    const sair = useCallback(() => {
        limparSessao();
        setSessao(null);
    }, []);

    // Quando a API recusa o token (expirado), encerra a sessão
    useEffect(() => {
        const aoExpirar = () => {
            sair();
            setAvisoSessao('Sua sessão expirou. Entre novamente para continuar.');
        };

        window.addEventListener('sessao-expirada', aoExpirar);
        return () => window.removeEventListener('sessao-expirada', aoExpirar);
    }, [sair]);

    const entrar = async (email, senha) => {
        const dados = await api.post('/usuarios/login', { email, senha });
        const novaSessao = { token: dados.token, usuario: dados.usuario };

        salvarSessao(novaSessao);
        setSessao(novaSessao);
        setAvisoSessao('');

        return dados.usuario;
    };

    const cadastrar = async (nome, email, senha) => {
        await api.post('/usuarios', { nome, email, senha });
        return entrar(email, senha);
    };

    const usuario = sessao?.usuario ?? null;

    return (
        <AuthContext.Provider
            value={{
                usuario,
                ehAdmin: usuario?.tipo === 'admin',
                entrar,
                cadastrar,
                sair,
                avisoSessao
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
