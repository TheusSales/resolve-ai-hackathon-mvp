import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Substitui o acesso ao banco por funções fake, para não precisar de um
// Postgres de verdade rodando durante os testes.
vi.mock("../src/db", () => {
  const mockPool = { query: vi.fn(), connect: vi.fn() };
  return { pool: mockPool, default: mockPool };
});

import app from "../src/app";
import pool from "../src/db";

const queryMock = pool.query as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  queryMock.mockReset();
});

describe("POST /api/auth/register", () => {
  it("cadastra um novo usuário como solicitante", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] }) // não existe usuário com esse email
      .mockResolvedValueOnce({
        rows: [{ id: 1, nome: "Maria", email: "maria@teste.com", perfil: "solicitante" }],
      });

    const resposta = await request(app).post("/api/auth/register").send({
      nome: "Maria",
      email: "maria@teste.com",
      senha: "123456",
    });

    expect(resposta.status).toBe(201);
    expect(resposta.body.usuario.perfil).toBe("solicitante");
    expect(resposta.body.token).toBeDefined();
  });

  it("recusa cadastro com email já usado", async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const resposta = await request(app).post("/api/auth/register").send({
      nome: "Maria",
      email: "maria@teste.com",
      senha: "123456",
    });

    expect(resposta.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("recusa login com senha errada", async () => {
    const senhaHash = await bcrypt.hash("senhaCorreta", 10);

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nome: "Maria",
          email: "maria@teste.com",
          senha_hash: senhaHash,
          perfil: "solicitante",
        },
      ],
    });

    const resposta = await request(app)
      .post("/api/auth/login")
      .send({ email: "maria@teste.com", senha: "senhaErrada" });

    expect(resposta.status).toBe(401);
  });

  it("recusa login de email que não existe", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const resposta = await request(app)
      .post("/api/auth/login")
      .send({ email: "naoexiste@teste.com", senha: "123456" });

    expect(resposta.status).toBe(401);
  });
});
