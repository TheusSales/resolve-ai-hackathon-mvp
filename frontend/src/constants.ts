// Listas fixas usadas nos formulários e na exibição das ocorrências.
// Precisam bater com as categorias aceitas no backend (backend/src/routes/ocorrencias.ts).

export const CATEGORIAS = [
  { valor: "iluminacao", rotulo: "Iluminação" },
  { valor: "equipamento_quebrado", rotulo: "Equipamento quebrado" },
  { valor: "acessibilidade", rotulo: "Falta de acessibilidade" },
  { valor: "limpeza", rotulo: "Limpeza" },
  { valor: "vazamento", rotulo: "Vazamento" },
  { valor: "seguranca", rotulo: "Problema de segurança" },
  { valor: "manutencao", rotulo: "Solicitação de manutenção" },
  { valor: "outros", rotulo: "Outros" },
];

export function rotuloCategoria(valor: string): string {
  return CATEGORIAS.find((c) => c.valor === valor)?.rotulo || valor;
}

export const STATUS_ROTULOS: Record<string, string> = {
  aberta: "Aberta",
  em_analise: "Em análise",
  em_atendimento: "Em atendimento",
  resolvida: "Resolvida",
  cancelada: "Cancelada",
};

export const PRIORIDADE_ROTULOS: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};
