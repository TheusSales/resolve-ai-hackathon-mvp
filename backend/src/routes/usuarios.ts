// Rotas auxiliares relacionadas a usuários.
import { Router } from "express";
import pool from "../db";
import { exigirLogin } from "../middleware/auth";

const router = Router();

// Lista os gestores, usada no formulário de "atribuir responsável".
router.get("/gestores", exigirLogin, async (req, res) => {
  const resultado = await pool.query(
    "SELECT id, nome, email FROM usuarios WHERE perfil = 'gestor' ORDER BY nome"
  );
  res.json(resultado.rows);
});

export default router;
