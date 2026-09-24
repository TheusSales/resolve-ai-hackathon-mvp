// Rotas de cadastro e login.
import bcrypt from "bcryptjs";
import { Router } from "express";
import pool from "../db";
import { gerarToken } from "../middleware/auth";

const router = Router();

// Cadastro de um novo usuário. Sempre cria como "solicitante" —
// o perfil de gestor só existe através do usuário padrão do sistema.
router.post("/register", async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "Preencha nome, email e senha" });
  }

  if (senha.length < 6) {
    return res
      .status(400)
      .json({ erro: "A senha precisa ter pelo menos 6 caracteres" });
  }

  const jaExiste = await pool.query("SELECT id FROM usuarios WHERE email = $1", [
    email,
  ]);

  if (jaExiste.rows.length > 0) {
    return res.status(400).json({ erro: "Já existe um usuário com esse email" });
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const resultado = await pool.query(
    `INSERT INTO usuarios (nome, email, senha_hash, perfil)
     VALUES ($1, $2, $3, 'solicitante')
     RETURNING id, nome, email, perfil`,
    [nome, email, senhaHash]
  );

  const usuario = resultado.rows[0];
  const token = gerarToken(usuario);

  res.status(201).json({ usuario, token });
});

// Login: confere email e senha e devolve um token JWT.
router.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: "Preencha email e senha" });
  }

  const resultado = await pool.query(
    "SELECT id, nome, email, senha_hash, perfil FROM usuarios WHERE email = $1",
    [email]
  );

  const usuario = resultado.rows[0];

  if (!usuario) {
    return res.status(401).json({ erro: "Email ou senha inválidos" });
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

  if (!senhaCorreta) {
    return res.status(401).json({ erro: "Email ou senha inválidos" });
  }

  const dadosUsuario = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
  };

  const token = gerarToken(dadosUsuario);

  res.json({ usuario: dadosUsuario, token });
});

export default router;
