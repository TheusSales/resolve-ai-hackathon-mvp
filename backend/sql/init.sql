-- Script de criação do banco de dados da plataforma Resolve Aí.
-- Usa "IF NOT EXISTS"/"ON CONFLICT" porque o backend roda esse script sozinho
-- toda vez que sobe (veja src/migrate.ts) — assim não precisa rodar nada
-- manualmente antes do primeiro deploy.

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  senha_hash VARCHAR(200) NOT NULL,
  perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('solicitante', 'gestor')),
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ocorrencias (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  descricao TEXT NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  localizacao VARCHAR(200),
  imagem BYTEA,
  imagem_tipo VARCHAR(50),
  prioridade VARCHAR(10) NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta')),
  status VARCHAR(20) NOT NULL DEFAULT 'aberta'
    CHECK (status IN ('aberta', 'em_analise', 'em_atendimento', 'resolvida', 'cancelada')),
  solicitante_id INTEGER NOT NULL REFERENCES usuarios(id),
  responsavel_id INTEGER REFERENCES usuarios(id),
  solucao TEXT,
  avaliacao_nota INTEGER CHECK (avaliacao_nota BETWEEN 1 AND 5),
  avaliacao_comentario TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comentarios (
  id SERIAL PRIMARY KEY,
  ocorrencia_id INTEGER NOT NULL REFERENCES ocorrencias(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  texto TEXT NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS historico_status (
  id SERIAL PRIMARY KEY,
  ocorrencia_id INTEGER NOT NULL REFERENCES ocorrencias(id) ON DELETE CASCADE,
  status_anterior VARCHAR(20),
  status_novo VARCHAR(20) NOT NULL,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  observacao TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ocorrencias_solicitante ON ocorrencias(solicitante_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_ocorrencia ON comentarios(ocorrencia_id);
CREATE INDEX IF NOT EXISTS idx_historico_ocorrencia ON historico_status(ocorrencia_id);

-- Usuário gestor padrão para testar o sistema.
-- Email: gestor@resolveai.com | Senha: 123456
INSERT INTO usuarios (nome, email, senha_hash, perfil)
VALUES (
  'Gestor Padrão',
  'gestor@resolveai.com',
  '$2a$10$/iVxiqTRitfekI373yegm.R5x0EU2adtyVMWQHX8MwPjjPEFQxap.',
  'gestor'
)
ON CONFLICT (email) DO NOTHING;
