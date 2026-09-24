// Configuração principal do Express: middlewares, rotas e servir o frontend.
import "express-async-errors"; // faz o Express capturar erros de rotas async automaticamente

import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";

import authRoutes from "./routes/auth";
import dashboardRoutes from "./routes/dashboard";
import ocorrenciasRoutes from "./routes/ocorrencias";
import usuariosRoutes from "./routes/usuarios";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/ocorrencias", ocorrenciasRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/usuarios", usuariosRoutes);

// Em produção (dentro do Docker) o frontend já buildado fica em "public".
// Se a pasta existir, o próprio Express serve os arquivos estáticos do React.
const pastaFrontend = path.join(__dirname, "..", "public");

if (fs.existsSync(pastaFrontend)) {
  app.use(express.static(pastaFrontend));

  app.get("*", (req, res) => {
    res.sendFile(path.join(pastaFrontend, "index.html"));
  });
}

// Tratamento de erros genérico: qualquer erro não tratado cai aqui.
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ erro: "Erro interno no servidor" });
});

export default app;
