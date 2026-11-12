// Guarda a sessão do usuário (token JWT e dados públicos) no navegador

const CHAVE = 'barbearia.sessao';

// Verifica se o token JWT já passou da data de expiração
const tokenExpirado = (token) => {
    try {
        const conteudo = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const { exp } = JSON.parse(atob(conteudo));
        return !exp || exp * 1000 <= Date.now();
    } catch {
        return true;
    }
};

// Lê a sessão salva, descartando sessões com token expirado
export function lerSessao() {
    try {
        const sessao = JSON.parse(localStorage.getItem(CHAVE));

        if (!sessao?.token || tokenExpirado(sessao.token)) {
            localStorage.removeItem(CHAVE);
            return null;
        }

        return sessao;
    } catch {
        return null;
    }
}

export function salvarSessao(sessao) {
    try {
        localStorage.setItem(CHAVE, JSON.stringify(sessao));
    } catch {
        // Navegador sem acesso ao armazenamento: a sessão vale só até recarregar a página
    }
}

export function limparSessao() {
    try {
        localStorage.removeItem(CHAVE);
    } catch {
        // Nada a limpar
    }
}

export const lerToken = () => lerSessao()?.token ?? null;
