// Componentes pequenos reutilizados em várias páginas
import { useState } from 'react';

// Botão para ações destrutivas: pede confirmação no próprio lugar antes de executar
export function BotaoConfirmar({
    children,
    pergunta = 'Tem certeza?',
    textoConfirmar = 'Sim',
    aoConfirmar,
    className = 'botao botao-perigo botao-pequeno'
}) {
    const [confirmando, setConfirmando] = useState(false);
    const [ocupado, setOcupado] = useState(false);

    if (!confirmando) {
        return (
            <button type="button" className={className} onClick={() => setConfirmando(true)}>
                {children}
            </button>
        );
    }

    const confirmar = async () => {
        setOcupado(true);

        try {
            await aoConfirmar();
        } finally {
            setOcupado(false);
            setConfirmando(false);
        }
    };

    return (
        <span className="confirmacao">
            <span>{pergunta}</span>
            <button type="button" className="botao botao-perigo botao-pequeno" disabled={ocupado} onClick={confirmar}>
                {textoConfirmar}
            </button>
            <button
                type="button"
                className="botao botao-secundario botao-pequeno"
                disabled={ocupado}
                onClick={() => setConfirmando(false)}
            >
                Não
            </button>
        </span>
    );
}

// Mensagem de erro, sucesso ou informação
export function Aviso({ tipo = 'info', children, aoFechar }) {
    if (!children) return null;

    return (
        <div className={`aviso aviso-${tipo}`} role={tipo === 'erro' ? 'alert' : 'status'}>
            <span>{children}</span>
            {aoFechar && (
                <button type="button" className="aviso-fechar" onClick={aoFechar} aria-label="Fechar aviso">
                    ×
                </button>
            )}
        </div>
    );
}

export function Carregando({ texto = 'Carregando...' }) {
    return (
        <p className="carregando" role="status">
            <span className="carregando-icone" aria-hidden="true" />
            {texto}
        </p>
    );
}

// Botões de navegação entre páginas de resultados
export function Paginacao({ pagina, totalPaginas, aoMudar }) {
    if (!totalPaginas || totalPaginas <= 1) return null;

    return (
        <nav className="paginacao" aria-label="Paginação">
            <button
                type="button"
                className="botao botao-secundario botao-pequeno"
                disabled={pagina <= 1}
                onClick={() => aoMudar(pagina - 1)}
            >
                Anterior
            </button>
            <span>
                Página {pagina} de {totalPaginas}
            </span>
            <button
                type="button"
                className="botao botao-secundario botao-pequeno"
                disabled={pagina >= totalPaginas}
                onClick={() => aoMudar(pagina + 1)}
            >
                Próxima
            </button>
        </nav>
    );
}

const NOMES_STATUS = {
    agendado: 'Agendado',
    concluido: 'Concluído',
    cancelado: 'Cancelado'
};

export function StatusAgendamento({ status }) {
    return <span className={`etiqueta etiqueta-${status}`}>{NOMES_STATUS[status] ?? status}</span>;
}

// Abas simples para alternar filtros
export function Abas({ opcoes, valor, aoMudar }) {
    return (
        <div className="abas" role="tablist">
            {opcoes.map((opcao) => (
                <button
                    key={opcao.valor}
                    type="button"
                    role="tab"
                    aria-selected={valor === opcao.valor}
                    className={valor === opcao.valor ? 'aba aba-ativa' : 'aba'}
                    onClick={() => aoMudar(opcao.valor)}
                >
                    {opcao.rotulo}
                </button>
            ))}
        </div>
    );
}
