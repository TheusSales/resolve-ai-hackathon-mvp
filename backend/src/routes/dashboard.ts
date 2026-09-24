// Rota do dashboard do gestor, com alguns números resumidos.
import { Router } from "express";
import pool from "../db";
import { apenasGestor, exigirLogin } from "../middleware/auth";

const router = Router();

router.get("/", exigirLogin, apenasGestor, async (req, res) => {
  const total = await pool.query("SELECT COUNT(*)::int AS total FROM ocorrencias");

  const porStatus = await pool.query(
    "SELECT status, COUNT(*)::int AS total FROM ocorrencias GROUP BY status"
  );

  const porCategoria = await pool.query(
    "SELECT categoria, COUNT(*)::int AS total FROM ocorrencias GROUP BY categoria"
  );

  const porPrioridade = await pool.query(
    "SELECT prioridade, COUNT(*)::int AS total FROM ocorrencias GROUP BY prioridade"
  );

  const mediaAvaliacao = await pool.query(
    "SELECT ROUND(AVG(avaliacao_nota)::numeric, 1) AS media FROM ocorrencias WHERE avaliacao_nota IS NOT NULL"
  );

  res.json({
    total: total.rows[0].total,
    porStatus: porStatus.rows,
    porCategoria: porCategoria.rows,
    porPrioridade: porPrioridade.rows,
    mediaAvaliacao: mediaAvaliacao.rows[0].media,
  });
});

export default router;
