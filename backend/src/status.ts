// Regras de transição de status das ocorrências.
// Cada ocorrência começa "aberta" e segue esse fluxo até ser resolvida ou cancelada.

export const STATUS_VALIDOS = [
  "aberta",
  "em_analise",
  "em_atendimento",
  "resolvida",
  "cancelada",
] as const;

export type Status = (typeof STATUS_VALIDOS)[number];

// De cada status, para quais status é permitido ir.
const TRANSICOES: Record<Status, Status[]> = {
  aberta: ["em_analise", "cancelada"],
  em_analise: ["em_atendimento", "cancelada"],
  em_atendimento: ["resolvida", "cancelada"],
  resolvida: [],
  cancelada: [],
};

export function statusValido(status: string): status is Status {
  return (STATUS_VALIDOS as readonly string[]).includes(status);
}

// Verifica se é permitido mudar de um status para outro.
export function podeMudarStatus(atual: Status, novo: Status): boolean {
  return TRANSICOES[atual].includes(novo);
}
