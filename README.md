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

## Funcionalidades do backend

- Cadastro e autenticação de usuários.
- Controle de acesso para administradores.
- Cadastro, consulta, atualização e desativação de serviços.
- Cadastro, consulta, atualização e desativação de barbeiros.
- Criação, consulta, atualização e cancelamento de agendamentos.
- Consulta de horários disponíveis.
- Validação de conflitos de horários.
- Proteção de rotas por autenticação e autorização.

## Estrutura do backend

```text
server/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   └── validators/
├── .env
├── .gitignore
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

**3.** Configure o arquivo `.env` com as seguintes variáveis:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=sua_string_de_conexao
JWT_SECRET=sua_chave_secreta
```

**4.** Inicie o servidor:

```bash
npm start
```

O backend estará disponível em:

`http://localhost:3000`

## Verificação da API

Para verificar se a API está funcionando, acesse:

`http://localhost:3000/api/status`

## Observação

Este projeto foi desenvolvido para fins acadêmicos.