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
- **Deploy**: Azure (Container Registry + App Service + Database for
  PostgreSQL).

## Rodando localmente com Docker (mais fácil)

Pré-requisito: Docker e Docker Compose instalados.

```bash
docker compose up --build
```

Isso sobe o Postgres (já criando as tabelas a partir de `backend/sql/init.sql`)
e a aplicação em `http://localhost:3000`.

Usuário gestor já cadastrado para testar:

- **email:** `gestor@resolveai.com`
- **senha:** `123456`

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

## Deploy na Azure

Passo a passo usando o Azure CLI (`az`). Ajuste os nomes conforme sua
assinatura.

```bash
# 1. login e resource group
az login
az group create --name rg-resolveai --location brazilsouth

# 2. Azure Container Registry + build da imagem
az acr create --resource-group rg-resolveai --name acrresolveai --sku Basic
az acr build --registry acrresolveai --image resolveai:latest .

# 3. Azure Database for PostgreSQL Flexible Server
az postgres flexible-server create \
  --resource-group rg-resolveai \
  --name pg-resolveai \
  --admin-user resolveai \
  --admin-password "SuaSenhaForte123!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 16 \
  --public-access 0.0.0.0-255.255.255.255

az postgres flexible-server db create \
  --resource-group rg-resolveai \
  --server-name pg-resolveai \
  --database-name resolveai

# roda o script de criação das tabelas
psql "host=pg-resolveai.postgres.database.azure.com port=5432 dbname=resolveai user=resolveai password=SuaSenhaForte123! sslmode=require" \
  -f backend/sql/init.sql

# 4. App Service (Web App for Containers) usando a imagem do ACR
az appservice plan create --resource-group rg-resolveai --name plan-resolveai --is-linux --sku B1

az webapp create \
  --resource-group rg-resolveai \
  --plan plan-resolveai \
  --name resolveai-app \
  --deployment-container-image-name acrresolveai.azurecr.io/resolveai:latest

az webapp config appsettings set \
  --resource-group rg-resolveai \
  --name resolveai-app \
  --settings \
    DATABASE_URL="postgres://resolveai:SuaSenhaForte123!@pg-resolveai.postgres.database.azure.com:5432/resolveai?sslmode=require" \
    JWT_SECRET="troque-por-uma-chave-bem-grande-e-aleatoria" \
    WEBSITES_PORT=3000
```

Depois disso, a aplicação fica disponível em
`https://resolveai-app.azurewebsites.net`. O `db.ts` do backend já liga o SSL
automaticamente quando detecta `sslmode=require` na `DATABASE_URL`.

Há também um workflow simples em `.github/workflows/ci.yml` que roda os
testes do backend e o build do frontend a cada push/PR.
