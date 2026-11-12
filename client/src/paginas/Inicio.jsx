import { Link } from 'react-router';
import { useAuth } from '../contexto/AuthContext';
import { useConsulta } from '../hooks/useConsulta';
import { Aviso, Carregando } from '../componentes/Interface';
import { formatarDuracao, formatarPreco } from '../servicos/formatacao';

// Página inicial: apresenta a barbearia, os serviços e os barbeiros
export default function Inicio() {
    const { usuario, ehAdmin } = useAuth();
    const servicos = useConsulta('/servicos');
    const barbeiros = useConsulta('/barbeiros');

    const chamada = ehAdmin
        ? { destino: '/admin/agendamentos', texto: 'Ver agenda' }
        : { destino: '/agendar', texto: 'Agendar horário' };

    return (
        <>
            <section className="destaque">
                <h1>Seu horário marcado, sem fila e sem espera.</h1>
                <p>
                    Escolha o serviço, o barbeiro e o horário que preferir. Atendemos de segunda a
                    sábado, das 08h às 18h.
                </p>
                <div className="acoes">
                    <Link to={chamada.destino} className="botao botao-grande">
                        {chamada.texto}
                    </Link>
                    {!usuario && (
                        <Link to="/login" className="botao botao-grande botao-secundario">
                            Já tenho conta
                        </Link>
                    )}
                </div>
            </section>

            <section className="secao" aria-labelledby="titulo-servicos">
                <h2 id="titulo-servicos">Serviços</h2>
                {servicos.carregando && <Carregando />}
                <Aviso tipo="erro">{servicos.erro}</Aviso>
                {servicos.dados?.servicos.length === 0 && (
                    <p className="vazio">Nenhum serviço cadastrado ainda.</p>
                )}
                <div className="grade">
                    {servicos.dados?.servicos.map((servico) => (
                        <article key={servico._id} className="cartao item-servico">
                            <h3>{servico.nome}</h3>
                            <p>{servico.descricao}</p>
                            <div className="item-detalhes">
                                <span className="texto-suave">{formatarDuracao(servico.duracaoMinutos)}</span>
                                <span className="preco">{formatarPreco(servico.preco)}</span>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="secao" aria-labelledby="titulo-barbeiros">
                <h2 id="titulo-barbeiros">Nossos barbeiros</h2>
                {barbeiros.carregando && <Carregando />}
                <Aviso tipo="erro">{barbeiros.erro}</Aviso>
                {barbeiros.dados?.barbeiros.length === 0 && (
                    <p className="vazio">Nenhum barbeiro cadastrado ainda.</p>
                )}
                <div className="grade">
                    {barbeiros.dados?.barbeiros.map((barbeiro) => (
                        <article key={barbeiro._id} className="cartao item-barbeiro">
                            <span className="avatar" aria-hidden="true">
                                {barbeiro.nome.charAt(0).toUpperCase()}
                            </span>
                            <div>
                                <h3>{barbeiro.nome}</h3>
                                <p>{barbeiro.especialidade}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </>
    );
}
