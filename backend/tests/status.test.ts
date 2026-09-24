import { describe, expect, it } from "vitest";
import { podeMudarStatus, statusValido } from "../src/status";

describe("regras de transição de status", () => {
  it("permite o fluxo normal de uma ocorrência", () => {
    expect(podeMudarStatus("aberta", "em_analise")).toBe(true);
    expect(podeMudarStatus("em_analise", "em_atendimento")).toBe(true);
    expect(podeMudarStatus("em_atendimento", "resolvida")).toBe(true);
  });

  it("permite cancelar a partir de aberta, em análise ou em atendimento", () => {
    expect(podeMudarStatus("aberta", "cancelada")).toBe(true);
    expect(podeMudarStatus("em_analise", "cancelada")).toBe(true);
    expect(podeMudarStatus("em_atendimento", "cancelada")).toBe(true);
  });

  it("não permite pular etapas", () => {
    expect(podeMudarStatus("aberta", "em_atendimento")).toBe(false);
    expect(podeMudarStatus("aberta", "resolvida")).toBe(false);
  });

  it("não permite mudar status de ocorrências já finalizadas", () => {
    expect(podeMudarStatus("resolvida", "em_analise")).toBe(false);
    expect(podeMudarStatus("cancelada", "aberta")).toBe(false);
  });

  it("valida nomes de status", () => {
    expect(statusValido("aberta")).toBe(true);
    expect(statusValido("resolvida")).toBe(true);
    expect(statusValido("nao_existe")).toBe(false);
  });
});
