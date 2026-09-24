// Tipos usados nas telas de ocorrências.

export interface OcorrenciaResumo {
  id: number;
  titulo: string;
  categoria: string;
  localizacao: string | null;
  prioridade: "baixa" | "media" | "alta";
  status: string;
  criado_em: string;
  tem_imagem: boolean;
  solicitante_nome: string;
  responsavel_nome: string | null;
}

export interface Comentario {
  id: number;
  texto: string;
  criado_em: string;
  usuario_nome: string;
  usuario_perfil: string;
}

export interface HistoricoItem {
  id: number;
  status_anterior: string | null;
  status_novo: string;
  observacao: string | null;
  criado_em: string;
  usuario_nome: string;
}

export interface OcorrenciaDetalhe {
  id: number;
  titulo: string;
  descricao: string;
  categoria: string;
  localizacao: string | null;
  prioridade: "baixa" | "media" | "alta";
  status: string;
  imagem_tipo: string | null;
  solicitante_id: number;
  solicitante_nome: string;
  responsavel_id: number | null;
  responsavel_nome: string | null;
  solucao: string | null;
  avaliacao_nota: number | null;
  avaliacao_comentario: string | null;
  criado_em: string;
  comentarios: Comentario[];
  historico: HistoricoItem[];
}

export interface Gestor {
  id: number;
  nome: string;
  email: string;
}
