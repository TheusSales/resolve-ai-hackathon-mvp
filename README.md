# Resolve Aí

Projeto do Hackathon da Fase 5 (Full Stack Development) da pós-graduação
FIAP/POSTECH. É uma plataforma simples de gestão de ocorrências (problemas de
iluminação, limpeza, vazamentos, segurança, manutenção etc.), pensada para
condomínios, empresas ou bairros registrarem e acompanharem esse tipo de
solicitação até a resolução.

## Perfis de usuário

- **Solicitante**: cria conta, registra ocorrências (com título, descrição,
  categoria, localização e uma foto opcional), acompanha o andamento,
  comenta, vê o histórico e avalia a resolução no final.
- **Gestor**: vê todas as ocorrências, filtra por categoria/status/prioridade,
  muda a prioridade, atribui um responsável, atualiza o status, comenta,
  registra a solução aplicada e acompanha um dashboard com indicadores.

Toda ocorrência segue o fluxo `aberta → em análise → em atendimento →
resolvida`, podendo ser `cancelada` a qualquer momento antes de ser resolvida.
Cada mudança de status fica registrada num histórico (status anterior, novo
status, data/hora, usuário responsável e observação).

Mais detalhes de arquitetura e os diagramas estão em [`docs/arquitetura.md`](docs/arquitetura.md).

## Tecnologias

- **Backend**: Node.js + Express + TypeScript, `pg` (SQL puro, sem ORM),
  autenticação com JWT, upload de imagem com Multer.
- **Frontend**: React + Vite + TypeScript, `react-router-dom`, CSS simples
  (sem biblioteca de componentes).
- **Banco de dados**: PostgreSQL.
- **Testes**: Vitest + Supertest (backend).
- **Docker**: uma imagem só, com o Express servindo a API e o build do React.
- **Deploy**: [Render](https://render.com) (Web Service via Docker + Postgres
  gerenciado), usando um Blueprint (`render.yaml`).

## Rodando localmente com Docker (mais fácil)

Pré-requisito: Docker e Docker Compose instalados.

```bash
docker compose up --build
```

Isso sobe o Postgres e a aplicação em `http://localhost:3000`. Na primeira
vez que o backend inicia, ele mesmo cria as tabelas (a partir de
`backend/sql/init.sql`, ver `backend/src/migrate.ts`) — não precisa rodar
nada manualmente.

Usuário gestor já cadastrado para testar:

- **email:** `gestor@resolveai.com`
- **senha:** `123456`

Esse login também aparece direto na própria tela de login do sistema
(`frontend/src/pages/Login.tsx`), como uma dica na tela — não precisa
procurar aqui no README pra testar.

Para criar um solicitante, basta usar a tela de cadastro.

## Rodando em modo desenvolvimento (sem Docker)

Precisa de Node.js 22+ e um Postgres rodando localmente.

```bash
# 1. suba um Postgres (pode usar só o serviço "db" do compose, por exemplo)
docker compose up db

# 2. backend
cd backend
cp .env.example .env   # ajuste DATABASE_URL se precisar
npm install
npm run dev             # http://localhost:3000

# 3. frontend (em outro terminal)
cd frontend
npm install
npm run dev              # http://localhost:5173, com proxy para a API
```

## Testes

```bash
cd backend
npm test
```

Os testes usam o `db.ts` mockado (via `vi.mock`), então não precisam de um
banco de dados de verdade rodando.

## Principais endpoints da API

Todas as rotas (exceto login/cadastro) exigem o header
`Authorization: Bearer <token>`.

| Método | Rota                                   | Quem pode         | Descrição                                   |
|--------|-----------------------------------------|--------------------|----------------------------------------------|
| POST   | `/api/auth/register`                    | Público            | Cria uma conta (sempre como solicitante)     |
| POST   | `/api/auth/login`                       | Público            | Login, devolve o token JWT                   |
| POST   | `/api/ocorrencias`                      | Solicitante        | Cria uma ocorrência (multipart, com imagem)  |
| GET    | `/api/ocorrencias`                      | Logado             | Lista ocorrências (solicitante vê só as suas)|
| GET    | `/api/ocorrencias/:id`                  | Dono ou gestor     | Detalhe, com comentários e histórico         |
| GET    | `/api/ocorrencias/:id/imagem`           | Público            | Devolve a imagem anexada                     |
| PATCH  | `/api/ocorrencias/:id/status`           | Gestor / dono*      | Muda o status (grava no histórico)           |
| PATCH  | `/api/ocorrencias/:id`                  | Gestor             | Muda prioridade, responsável e/ou solução    |
| POST   | `/api/ocorrencias/:id/comentarios`      | Dono ou gestor     | Adiciona um comentário                       |
| POST   | `/api/ocorrencias/:id/avaliacao`        | Dono               | Avalia a resolução (só quando `resolvida`)   |
| GET    | `/api/usuarios/gestores`                | Logado             | Lista gestores (para atribuir responsável)   |
| GET    | `/api/dashboard`                        | Gestor             | Números para o dashboard                     |

\* o solicitante só pode usar essa rota para **cancelar** a própria
ocorrência enquanto ela ainda está `aberta`; qualquer outra transição é
exclusiva do gestor.

## Deploy

O enunciado do hackathon pede só "deploy em cloud", sem exigir um provedor
específico. A ideia inicial era usar a Azure (foi o que vimos nas matérias da
pós), mas o cadastro de assinatura deu bastante trabalho: a conta usada não
era elegível pro crédito gratuito, e o login por linha de comando esbarrou
numa política de segurança do tenant (bloqueio do fluxo de device code). Como
o objetivo aqui é ter algo simples e funcionando, optamos por trocar para o
**[Render](https://render.com)**, que também tem plano gratuito, não pede
cartão de crédito e o deploy é bem mais direto.

### Deploy no Render

O repositório já tem um Blueprint (`render.yaml`) descrevendo os dois
recursos necessários: o Web Service (que builda a partir do `Dockerfile`) e
o banco Postgres, já ligados um no outro pela variável `DATABASE_URL`.

1. Instale o [Render CLI](https://render.com/docs/cli) (opcional, só pra
   acompanhar deploys/logs pelo terminal depois) e rode `render login`.
2. No painel do Render (**dashboard.render.com → New → Blueprint**), conecte
   este repositório do GitHub. Esse passo de autorizar o GitHub só dá pra
   fazer pela interface web mesmo (é assim em qualquer provedor).
3. O Render lê o `render.yaml`, mostra o plano (1 Web Service + 1 Postgres,
   ambos no plano free) e é só clicar em **Apply**.
4. Aguarde o build da imagem Docker. Na primeira inicialização o próprio
   backend cria as tabelas no banco (`backend/src/migrate.ts`) — não precisa
   rodar nenhum script manualmente.
5. Pronto: a aplicação fica disponível na URL que o Render gera.

Depois de criado, dá pra acompanhar tudo pelo CLI: `render services`,
`render logs`, `render deploys list`, etc.

**Aplicação em produção:** https://resolveai-7nms.onrender.com

> O plano free do Render hiberna o serviço depois de ~15 min sem tráfego —
> a primeira requisição depois disso demora um pouco (30-60s) pra "acordar".
> O banco gratuito também expira 30 dias após a criação.

Há também um workflow simples em `.github/workflows/ci.yml` que roda os
testes do backend e o build do frontend a cada push/PR.
