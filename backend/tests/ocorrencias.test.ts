import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/db", () => {
  const mockPool = { query: vi.fn(), connect: vi.fn() };
  return { pool: mockPool, default: mockPool };
});

import app from "../src/app";
import pool from "../src/db";
import { gerarToken } from "../src/middleware/auth";

const queryMock = pool.query as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  queryMock.mockReset();
});

const tokenSolicitante = gerarToken({
  id: 10,
  nome: "João Solicitante",
  email: "joao@teste.com",
  perfil: "solicitante",
});

const tokenGestor = gerarToken({
  id: 1,
  nome: "Gestor Padrão",
  email: "gestor@resolveai.com",
  perfil: "gestor",
});

describe("PATCH /api/ocorrencias/:id (rota exclusiva de gestor)", () => {
  it("retorna 403 quando quem chama é um solicitante", async () => {
    const resposta = await request(app)
      .patch("/api/ocorrencias/1")
      .set("Authorization", `Bearer ${tokenSolicitante}`)
      .send({ prioridade: "alta" });

    expect(resposta.status).toBe(403);
    // nem chegou a consultar o banco, pois o middleware barrou antes
    expect(queryMock).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/ocorrencias/:id/status", () => {
  it("recusa uma transição de status inválida", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          status: "resolvida", // status final: não pode mudar mais
          solicitante_id: 10,
        },
      ],
    });

    const resposta = await request(app)
      .patch("/api/ocorrencias/1/status")
      .set("Authorization", `Bearer ${tokenGestor}`)
      .send({ status: "em_analise" });

    expect(resposta.status).toBe(400);
  });

  it("recusa um solicitante tentando mudar o status de outra pessoa", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          status: "aberta",
          solicitante_id: 999, // não é o dono (que é o id 10)
        },
      ],
    });

    const resposta = await request(app)
      .patch("/api/ocorrencias/1/status")
      .set("Authorization", `Bearer ${tokenSolicitante}`)
      .send({ status: "cancelada" });

    expect(resposta.status).toBe(403);
  });
});

describe("GET /api/ocorrencias", () => {
  it("exige autenticação", async () => {
    const resposta = await request(app).get("/api/ocorrencias");
    expect(resposta.status).toBe(401);
  });
});
