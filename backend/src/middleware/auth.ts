// Middlewares de autenticação e autorização usando JWT.
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "troque-essa-chave-em-producao";

export interface UsuarioToken {
  id: number;
  nome: string;
  email: string;
  perfil: "solicitante" | "gestor";
}

// Adiciona o campo "user" na Request do Express.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UsuarioToken;
    }
  }
}

export function gerarToken(usuario: UsuarioToken): string {
  return jwt.sign(usuario, JWT_SECRET, { expiresIn: "8h" });
}

// Exige que o usuário esteja autenticado (token válido no header Authorization).
export function exigirLogin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Token não informado" });
  }

  const token = header.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, JWT_SECRET) as UsuarioToken;
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}

// Exige que o usuário logado seja um gestor.
export function apenasGestor(req: Request, res: Response, next: NextFunction) {
  if (req.user?.perfil !== "gestor") {
    return res
      .status(403)
      .json({ erro: "Apenas gestores podem realizar essa ação" });
  }
  next();
}
