# Arquitetura — Resolve Aí

Esse documento mostra, de forma simples, como as peças do sistema se conectam.

## Visão geral

Uma aplicação Full Stack clássica: um frontend em React que conversa com uma
API em Node/Express, que por sua vez lê e escreve num banco Postgres. Tudo
roda dentro de um único container (o Express também serve os arquivos
estáticos do React em produção).

```mermaid
flowchart LR
    U[Usuário<br/>navegador] -->|HTTPS| APP[App Service<br/>Node + Express<br/>serve API e o React]
    APP -->|SQL| DB[(Azure Database<br/>for PostgreSQL)]
```

## Modelo de dados (ER simplificado)

```mermaid
erDiagram
    USUARIOS ||--o{ OCORRENCIAS : "registra (solicitante_id)"
    USUARIOS ||--o{ OCORRENCIAS : "é responsável (responsavel_id)"
    USUARIOS ||--o{ COMENTARIOS : escreve
    USUARIOS ||--o{ HISTORICO_STATUS : altera
    OCORRENCIAS ||--o{ COMENTARIOS : possui
    OCORRENCIAS ||--o{ HISTORICO_STATUS : possui

    USUARIOS {
        int id PK
        string nome
        string email
        string senha_hash
        string perfil "solicitante ou gestor"
    }

    OCORRENCIAS {
        int id PK
        string titulo
        string descricao
        string categoria
        string localizacao
        bytea imagem
        string prioridade "baixa, media, alta"
        string status
        int solicitante_id FK
        int responsavel_id FK
        string solucao
        int avaliacao_nota
    }

    COMENTARIOS {
        int id PK
        int ocorrencia_id FK
        int usuario_id FK
        string texto
    }

    HISTORICO_STATUS {
        int id PK
        int ocorrencia_id FK
        string status_anterior
        string status_novo
        int usuario_id FK
        string observacao
    }
```

## Ciclo de vida da ocorrência

Toda ocorrência nasce **aberta** e segue esse fluxo. Cada seta representa uma
troca de status, e cada troca gera uma linha na tabela `historico_status`
(status anterior, novo status, data/hora, usuário responsável e observação).

```mermaid
stateDiagram-v2
    [*] --> aberta
    aberta --> em_analise
    em_analise --> em_atendimento
    em_atendimento --> resolvida
    aberta --> cancelada
    em_analise --> cancelada
    em_atendimento --> cancelada
    resolvida --> [*]
    cancelada --> [*]
```

## Perfis de usuário

- **Solicitante**: cria conta, registra ocorrências, acompanha o andamento,
  comenta, consulta o histórico e avalia a resolução.
- **Gestor**: vê todas as ocorrências, filtra por categoria/status/prioridade,
  muda a prioridade, atribui um responsável, muda o status, comenta, registra
  a solução aplicada e acompanha o dashboard com indicadores.
