// Rotas de ocorrências: criar, listar, ver detalhes, mudar status,
// comentar e avaliar.
import { Router } from "express";
import multer from "multer";
import pool from "../db";
import { apenasGestor, exigirLogin } from "../middleware/auth";
import { podeMudarStatus, statusValido } from "../status";

const router = Router();

// Guarda a imagem só na memória, depois salvamos como BYTEA no banco.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const CATEGORIAS = [
  "iluminacao",
  "equipamento_quebrado",
  "acessibilidade",
  "limpeza",
  "vazamento",
  "seguranca",
  "manutencao",
  "outros",
];

const PRIORIDADES = ["baixa", "media", "alta"];

// Criar uma ocorrência (solicitante).
router.post(
  "/",
  exigirLogin,
  upload.single("imagem"),
  async (req, res) => {
    const { titulo, descricao, categoria, localizacao } = req.body;

    if (!titulo || !descricao || !categoria) {
      return res
        .status(400)
        .json({ erro: "Preencha título, descrição e categoria" });
    }

    if (!CATEGORIAS.includes(categoria)) {
      return res.status(400).json({ erro: "Categoria inválida" });
    }

    const imagem = req.file ? req.file.buffer : null;
    const imagemTipo = req.file ? req.file.mimetype : null;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const resultado = await client.query(
        `INSERT INTO ocorrencias
          (titulo, descricao, categoria, localizacao, imagem, imagem_tipo, solicitante_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, titulo, descricao, categoria, localizacao, prioridade, status,
                   solicitante_id, responsavel_id, criado_em, atualizado_em`,
        [titulo, descricao, categoria, localizacao || null, imagem, imagemTipo, req.user!.id]
      );

      const ocorrencia = resultado.rows[0];

      await client.query(
        `INSERT INTO historico_status (ocorrencia_id, status_anterior, status_novo, usuario_id, observacao)
         VALUES ($1, NULL, 'aberta', $2, 'Ocorrência registrada')`,
        [ocorrencia.id, req.user!.id]
      );

      await client.query("COMMIT");

      res.status(201).json(ocorrencia);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
);

// Listar ocorrências. Solicitante só vê as suas; gestor vê todas e pode filtrar.
router.get("/", exigirLogin, async (req, res) => {
  const { categoria, status, prioridade } = req.query;

  const condicoes: string[] = [];
  const valores: any[] = [];

  if (req.user!.perfil === "solicitante") {
    valores.push(req.user!.id);
    condicoes.push(`o.solicitante_id = $${valores.length}`);
  }

  if (categoria) {
    valores.push(categoria);
    condicoes.push(`o.categoria = $${valores.length}`);
  }

  if (status) {
    valores.push(status);
    condicoes.push(`o.status = $${valores.length}`);
  }

  if (prioridade) {
    valores.push(prioridade);
    condicoes.push(`o.prioridade = $${valores.length}`);
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

  const resultado = await pool.query(
    `SELECT o.id, o.titulo, o.categoria, o.localizacao, o.prioridade, o.status,
            o.criado_em, o.atualizado_em, o.imagem IS NOT NULL AS tem_imagem,
            s.nome AS solicitante_nome, r.nome AS responsavel_nome
     FROM ocorrencias o
     JOIN usuarios s ON s.id = o.solicitante_id
     LEFT JOIN usuarios r ON r.id = o.responsavel_id
     ${where}
     ORDER BY o.criado_em DESC`,
    valores
  );

  res.json(resultado.rows);
});

// Busca a ocorrência e confere se o usuário pode vê-la (dono ou gestor).
async function buscarOcorrenciaOuFalhar(id: string, res: any, user: Express.Request["user"]) {
  const resultado = await pool.query(
    `SELECT o.*, s.nome AS solicitante_nome, r.nome AS responsavel_nome
     FROM ocorrencias o
     JOIN usuarios s ON s.id = o.solicitante_id
     LEFT JOIN usuarios r ON r.id = o.responsavel_id
     WHERE o.id = $1`,
    [id]
  );

  const ocorrencia = resultado.rows[0];

  if (!ocorrencia) {
    res.status(404).json({ erro: "Ocorrência não encontrada" });
    return null;
  }

  if (user?.perfil === "solicitante" && ocorrencia.solicitante_id !== user.id) {
    res.status(403).json({ erro: "Você não tem acesso a essa ocorrência" });
    return null;
  }

  return ocorrencia;
}

// Detalhes de uma ocorrência, com comentários e histórico de status.
router.get("/:id", exigirLogin, async (req, res) => {
  const ocorrencia = await buscarOcorrenciaOuFalhar(req.params.id, res, req.user);
  if (!ocorrencia) return;

  delete (ocorrencia as any).imagem; // a imagem é buscada à parte, em /imagem

  const comentarios = await pool.query(
    `SELECT c.id, c.texto, c.criado_em, u.nome AS usuario_nome, u.perfil AS usuario_perfil
     FROM comentarios c
     JOIN usuarios u ON u.id = c.usuario_id
     WHERE c.ocorrencia_id = $1
     ORDER BY c.criado_em ASC`,
    [req.params.id]
  );

  const historico = await pool.query(
    `SELECT h.id, h.status_anterior, h.status_novo, h.observacao, h.criado_em,
            u.nome AS usuario_nome
     FROM historico_status h
     JOIN usuarios u ON u.id = h.usuario_id
     WHERE h.ocorrencia_id = $1
     ORDER BY h.criado_em ASC`,
    [req.params.id]
  );

  res.json({
    ...ocorrencia,
    comentarios: comentarios.rows,
    historico: historico.rows,
  });
});

// Devolve a imagem anexada à ocorrência (se houver).
router.get("/:id/imagem", async (req, res) => {
  const resultado = await pool.query(
    "SELECT imagem, imagem_tipo FROM ocorrencias WHERE id = $1",
    [req.params.id]
  );

  const linha = resultado.rows[0];

  if (!linha || !linha.imagem) {
    return res.status(404).end();
  }

  res.set("Content-Type", linha.imagem_tipo || "application/octet-stream");
  res.send(linha.imagem);
});

// Muda o status da ocorrência. Gestores podem seguir o fluxo normal;
// o próprio solicitante pode cancelar enquanto a ocorrência ainda está "aberta".
router.patch("/:id/status", exigirLogin, async (req, res) => {
  const { status: novoStatus, observacao } = req.body;

  if (!statusValido(novoStatus)) {
    return res.status(400).json({ erro: "Status inválido" });
  }

  const ocorrencia = await buscarOcorrenciaOuFalhar(req.params.id, res, req.user);
  if (!ocorrencia) return;

  const ehGestor = req.user!.perfil === "gestor";
  const ehDono = ocorrencia.solicitante_id === req.user!.id;
  const podeCancelarComoDono =
    ehDono && novoStatus === "cancelada" && ocorrencia.status === "aberta";

  if (!ehGestor && !podeCancelarComoDono) {
    return res
      .status(403)
      .json({ erro: "Você não pode alterar o status dessa ocorrência" });
  }

  if (!podeMudarStatus(ocorrencia.status, novoStatus)) {
    return res.status(400).json({
      erro: `Não é possível mudar de "${ocorrencia.status}" para "${novoStatus}"`,
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      "UPDATE ocorrencias SET status = $1, atualizado_em = NOW() WHERE id = $2",
      [novoStatus, ocorrencia.id]
    );

    await client.query(
      `INSERT INTO historico_status (ocorrencia_id, status_anterior, status_novo, usuario_id, observacao)
       VALUES ($1, $2, $3, $4, $5)`,
      [ocorrencia.id, ocorrencia.status, novoStatus, req.user!.id, observacao || null]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  res.json({ ok: true, status: novoStatus });
});

// Atualiza prioridade, responsável e/ou solução (gestor).
router.patch("/:id", exigirLogin, apenasGestor, async (req, res) => {
  const ocorrencia = await buscarOcorrenciaOuFalhar(req.params.id, res, req.user);
  if (!ocorrencia) return;

  const { prioridade, responsavel_id, solucao } = req.body;

  if (prioridade && !PRIORIDADES.includes(prioridade)) {
    return res.status(400).json({ erro: "Prioridade inválida" });
  }

  const resultado = await pool.query(
    `UPDATE ocorrencias
     SET prioridade = COALESCE($1, prioridade),
         responsavel_id = COALESCE($2, responsavel_id),
         solucao = COALESCE($3, solucao),
         atualizado_em = NOW()
     WHERE id = $4
     RETURNING id, prioridade, responsavel_id, solucao, status`,
    [prioridade || null, responsavel_id || null, solucao || null, ocorrencia.id]
  );

  res.json(resultado.rows[0]);
});

// Adiciona um comentário (dono da ocorrência ou gestor).
router.post("/:id/comentarios", exigirLogin, async (req, res) => {
  const ocorrencia = await buscarOcorrenciaOuFalhar(req.params.id, res, req.user);
  if (!ocorrencia) return;

  const { texto } = req.body;

  if (!texto || !texto.trim()) {
    return res.status(400).json({ erro: "O comentário não pode ser vazio" });
  }

  const resultado = await pool.query(
    `INSERT INTO comentarios (ocorrencia_id, usuario_id, texto)
     VALUES ($1, $2, $3)
     RETURNING id, texto, criado_em`,
    [ocorrencia.id, req.user!.id, texto.trim()]
  );

  res.status(201).json(resultado.rows[0]);
});

// Avalia a resolução (só o dono, só quando a ocorrência está resolvida).
router.post("/:id/avaliacao", exigirLogin, async (req, res) => {
  const ocorrencia = await buscarOcorrenciaOuFalhar(req.params.id, res, req.user);
  if (!ocorrencia) return;

  if (ocorrencia.solicitante_id !== req.user!.id) {
    return res
      .status(403)
      .json({ erro: "Só o solicitante pode avaliar a resolução" });
  }

  if (ocorrencia.status !== "resolvida") {
    return res
      .status(400)
      .json({ erro: "Só é possível avaliar uma ocorrência resolvida" });
  }

  const { nota, comentario } = req.body;

  if (!nota || nota < 1 || nota > 5) {
    return res.status(400).json({ erro: "A nota deve ser entre 1 e 5" });
  }

  await pool.query(
    `UPDATE ocorrencias
     SET avaliacao_nota = $1, avaliacao_comentario = $2
     WHERE id = $3`,
    [nota, comentario || null, ocorrencia.id]
  );

  res.json({ ok: true });
});

export default router;
