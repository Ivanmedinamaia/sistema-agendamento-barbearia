# Sistema de Agendamento para Barbearia

Projeto acadêmico de desenvolvimento Full Stack para gerenciamento de agendamentos de serviços de barbearia.

## Tecnologias utilizadas

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- JavaScript
- JWT (autenticação)
- Bcrypt (criptografia de senhas)
- Joi (validação de dados)
- Helmet
- CORS

### Frontend
- React
- Vite
- React Router

## Funcionalidades do backend

- Cadastro e autenticação de usuários.
- Controle de acesso para administradores.
- Cadastro, consulta, atualização e desativação de serviços.
- Cadastro, consulta, atualização e desativação de barbeiros.
- Criação, consulta (paginada), atualização, cancelamento e conclusão de agendamentos.
- Consulta de horários disponíveis.
- Validação de conflitos de horários, inclusive em requisições simultâneas.
- Proteção de rotas por autenticação e autorização.

## Regras de agendamento

- Fuso horário: `America/Boa_Vista`.
- Funcionamento de segunda a sábado, das 08h às 18h, com intervalo de almoço das 12h às 13h.
- Os atendimentos começam em intervalos de 20 minutos.
- Um barbeiro não pode ter dois atendimentos ativos sobrepostos. Essa regra é garantida
  por um índice único no MongoDB, então vale mesmo quando duas pessoas tentam reservar
  o mesmo horário ao mesmo tempo.

## Funcionalidades do frontend

- Página inicial com os serviços e os barbeiros.
- Cadastro, login e logout.
- Agendamento em etapas: serviço, barbeiro, dia e horários livres.
- Meus agendamentos: próximos e histórico, com opções de remarcar e cancelar.
- Painel do administrador: agenda completa com filtros, conclusão e cancelamento de
  atendimentos, além do cadastro de serviços e barbeiros.
- Layout adaptado para celular.

## Estrutura do projeto

```text
client/                  → frontend (React + Vite)
├── src/
│   ├── componentes/     → layout, proteção de rotas e componentes reutilizáveis
│   ├── contexto/        → login e sessão do usuário
│   ├── hooks/           → busca de dados na API
│   ├── paginas/         → telas do cliente e do administrador (admin/)
│   ├── servicos/        → cliente HTTP, sessão e formatação de datas e valores
│   ├── App.jsx          → rotas
│   └── estilos.css
├── .env.example
├── index.html
├── package.json
└── vite.config.js

server/                  → backend (API)
├── scripts/
│   └── promoverAdmin.js
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── validators/
├── test/
├── .env.example
├── index.js
├── package.json
└── package-lock.json
```

## Como executar o backend

**1.** Entre na pasta `server`.

**2.** Instale as dependências:

```bash
npm install
```

**3.** Copie o arquivo `.env.example` para `.env` e preencha as variáveis:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=sua_string_de_conexao
JWT_SECRET=sua_chave_secreta
TRUST_PROXY=
```

`MONGODB_URI` e `JWT_SECRET` são obrigatórias: o servidor não inicia sem elas.
`TRUST_PROXY` só precisa ser preenchida quando a API roda atrás de um proxy
(por exemplo, `1` no Render ou Railway), para que o limite de tentativas de login
identifique o IP real de cada cliente.

**4.** Inicie o servidor:

```bash
npm start
```

Durante o desenvolvimento, use `npm run dev` para reiniciar o servidor automaticamente a cada alteração.

O backend estará disponível em:

`http://localhost:3000`

## Como executar o frontend

Com o backend rodando, abra outro terminal:

**1.** Entre na pasta `client`.

**2.** Instale as dependências:

```bash
npm install
```

**3.** Inicie o frontend:

```bash
npm run dev
```

O sistema estará disponível em:

`http://localhost:5173`

Em desenvolvimento não é preciso configurar nada: o Vite encaminha as chamadas de `/api`
para `http://localhost:3000`. Em produção, gere os arquivos com `npm run build` e
informe o endereço da API em `VITE_API_URL` (veja `client/.env.example`). Lembre-se de
colocar o endereço do frontend em `FRONTEND_URL` no `.env` do backend.

> No Windows, se o PowerShell bloquear o `npm`, use `npm.cmd` no lugar (por exemplo, `npm.cmd run dev`).

## Criando um administrador

Cadastre o usuário normalmente pela rota `POST /api/usuarios` e depois, dentro da pasta `server`, execute:

```bash
npm run promover-admin -- email@exemplo.com
```

O usuário precisa fazer login novamente para receber um token com a permissão de administrador.

## Principais rotas

| Método | Rota | Acesso |
|---|---|---|
| POST | `/api/usuarios` | Público (cadastro) |
| POST | `/api/usuarios/login` | Público |
| GET | `/api/servicos`, `/api/servicos/:id` | Público |
| POST, PUT, DELETE | `/api/servicos`, `/api/servicos/:id` | Administrador |
| GET | `/api/barbeiros`, `/api/barbeiros/:id` | Público (email e telefone apenas para administradores) |
| POST, PUT | `/api/barbeiros`, `/api/barbeiros/:id` | Administrador |
| PATCH | `/api/barbeiros/:id/desativar` | Administrador |
| POST | `/api/agendamentos` | Autenticado |
| GET | `/api/agendamentos?pagina=1&limite=20&periodo=proximos&status=agendado` | Autenticado (administrador vê todos) |
| GET | `/api/agendamentos/disponibilidade?barbeiro=&servico=&data=YYYY-MM-DD&ignorar=` | Autenticado |
| GET, PATCH | `/api/agendamentos/:id` | Dono do agendamento ou administrador |
| PATCH | `/api/agendamentos/:id/cancelar` | Dono do agendamento ou administrador |
| PATCH | `/api/agendamentos/:id/concluir` | Administrador (somente após o horário de início) |

Na listagem de agendamentos, `periodo` (`proximos` ou `anteriores`) e `status`
(`agendado`, `concluido` ou `cancelado`) são filtros opcionais. Na disponibilidade,
`ignorar` recebe o ID de um agendamento que está sendo remarcado, para que o horário
atual dele apareça como livre.

## Testes

```bash
npm test
```

## Verificação da API

Para verificar se a API está funcionando, acesse:

`http://localhost:3000/api/status`

## Observação

Este projeto foi desenvolvido para fins acadêmicos.
