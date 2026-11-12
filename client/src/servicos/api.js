// Cliente HTTP da API da barbearia
import { lerToken } from './sessao';

// Em desenvolvimento fica vazio e o Vite encaminha /api para o backend
const URL_BASE = `${import.meta.env.VITE_API_URL || ''}/api`;

// Erro com a mensagem e o status HTTP retornados pela API
export class ErroApi extends Error {
    constructor(mensagem, status) {
        super(mensagem);
        this.status = status;
    }
}

async function requisicao(metodo, caminho, corpo) {
    const token = lerToken();
    const cabecalhos = {};

    if (corpo !== undefined) {
        cabecalhos['Content-Type'] = 'application/json';
    }

    if (token) {
        cabecalhos.Authorization = `Bearer ${token}`;
    }

    let resposta;

    try {
        resposta = await fetch(URL_BASE + caminho, {
            method: metodo,
            headers: cabecalhos,
            body: corpo !== undefined ? JSON.stringify(corpo) : undefined
        });
    } catch {
        throw new ErroApi(
            'Não foi possível conectar ao servidor. Verifique se a API está em execução.',
            0
        );
    }

    const dados = await resposta.json().catch(() => null);

    if (!resposta.ok) {
        // Token expirado ou inválido: avisa a aplicação para encerrar a sessão
        if (resposta.status === 401 && token) {
            window.dispatchEvent(new Event('sessao-expirada'));
        }

        throw new ErroApi(
            dados?.mensagem || 'Ocorreu um erro inesperado. Tente novamente.',
            resposta.status
        );
    }

    return dados;
}

export const api = {
    get: (caminho) => requisicao('GET', caminho),
    post: (caminho, corpo = {}) => requisicao('POST', caminho, corpo),
    put: (caminho, corpo = {}) => requisicao('PUT', caminho, corpo),
    patch: (caminho, corpo) => requisicao('PATCH', caminho, corpo),
    delete: (caminho) => requisicao('DELETE', caminho)
};
