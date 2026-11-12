import { useCallback, useEffect, useState } from 'react';
import { api } from '../servicos/api';

// Busca dados de uma rota GET da API e controla carregamento e erro.
// Quando o caminho é null, nada é buscado.
export function useConsulta(caminho) {
    const [estado, setEstado] = useState({ dados: null, erro: '', carregando: Boolean(caminho) });
    const [versao, setVersao] = useState(0);

    useEffect(() => {
        if (!caminho) {
            setEstado({ dados: null, erro: '', carregando: false });
            return;
        }

        // Ignora respostas que chegam depois que o caminho mudou
        let ativo = true;

        setEstado((anterior) => ({ ...anterior, erro: '', carregando: true }));

        api.get(caminho)
            .then((dados) => {
                if (ativo) setEstado({ dados, erro: '', carregando: false });
            })
            .catch((erro) => {
                if (ativo) setEstado({ dados: null, erro: erro.message, carregando: false });
            });

        return () => {
            ativo = false;
        };
    }, [caminho, versao]);

    const recarregar = useCallback(() => setVersao((v) => v + 1), []);

    return { ...estado, recarregar };
}
