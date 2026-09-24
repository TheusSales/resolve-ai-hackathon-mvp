import { type FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, getUsuario } from "../api";
import StatusBadge from "../components/StatusBadge";
import { PRIORIDADE_ROTULOS, STATUS_ROTULOS, rotuloCategoria } from "../constants";
import type { Gestor, OcorrenciaDetalhe } from "../types";

// Mesma regra de transição do backend (backend/src/status.ts), só que aqui
// é usada apenas para decidir quais opções mostrar no formulário.
const TRANSICOES: Record<string, string[]> = {
  aberta: ["em_analise", "cancelada"],
  em_analise: ["em_atendimento", "cancelada"],
  em_atendimento: ["resolvida", "cancelada"],
  resolvida: [],
  cancelada: [],
};

function formatarData(data: string) {
  return new Date(data).toLocaleString("pt-BR");
}

export default function DetalheOcorrencia() {
  const { id } = useParams();
  const usuario = getUsuario();

  const [ocorrencia, setOcorrencia] = useState<OcorrenciaDetalhe | null>(null);
  const [gestores, setGestores] = useState<Gestor[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  // formulário de gestão (gestor)
  const [prioridade, setPrioridade] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [solucao, setSolucao] = useState("");

  // formulário de troca de status (gestor)
  const [novoStatus, setNovoStatus] = useState("");
  const [observacao, setObservacao] = useState("");

  // comentário
  const [novoComentario, setNovoComentario] = useState("");

  // avaliação (solicitante)
  const [nota, setNota] = useState(5);
  const [comentarioAvaliacao, setComentarioAvaliacao] = useState("");

  function carregar() {
    if (!id) return;
    api
      .get(`/ocorrencias/${id}`)
      .then((dados: OcorrenciaDetalhe) => {
        setOcorrencia(dados);
        setPrioridade(dados.prioridade);
        setResponsavelId(dados.responsavel_id ? String(dados.responsavel_id) : "");
        setSolucao(dados.solucao || "");
      })
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar();
    if (usuario?.perfil === "gestor") {
      api.get("/usuarios/gestores").then(setGestores).catch(() => {});
    }
    // só precisa recarregar quando o id da ocorrência mudar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (carregando) return <p>Carregando...</p>;
  if (erro && !ocorrencia) return <p className="erro">{erro}</p>;
  if (!ocorrencia) return null;

  const ehGestor = usuario?.perfil === "gestor";
  const ehDono = usuario?.id === ocorrencia.solicitante_id;
  const transicoesPossiveis = TRANSICOES[ocorrencia.status] || [];

  async function enviarComentario(evento: FormEvent) {
    evento.preventDefault();
    if (!novoComentario.trim()) return;

    try {
      await api.post(`/ocorrencias/${id}/comentarios`, { texto: novoComentario });
      setNovoComentario("");
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function atualizarStatus(evento: FormEvent) {
    evento.preventDefault();
    if (!novoStatus) return;

    try {
      await api.patch(`/ocorrencias/${id}/status`, { status: novoStatus, observacao });
      setNovoStatus("");
      setObservacao("");
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function cancelarComoSolicitante() {
    if (!window.confirm("Tem certeza que deseja cancelar essa ocorrência?")) return;

    try {
      await api.patch(`/ocorrencias/${id}/status`, {
        status: "cancelada",
        observacao: "Cancelada pelo solicitante",
      });
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function salvarGestao(evento: FormEvent) {
    evento.preventDefault();

    try {
      await api.patch(`/ocorrencias/${id}`, {
        prioridade,
        responsavel_id: responsavelId ? Number(responsavelId) : undefined,
        solucao,
      });
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function enviarAvaliacao(evento: FormEvent) {
    evento.preventDefault();

    try {
      await api.post(`/ocorrencias/${id}/avaliacao`, { nota, comentario: comentarioAvaliacao });
      carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  return (
    <div>
      <div className="bloco">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h2 style={{ margin: 0 }}>{ocorrencia.titulo}</h2>
          <StatusBadge status={ocorrencia.status} />
        </div>

        <p className="texto-ajuda">
          {rotuloCategoria(ocorrencia.categoria)} · Prioridade {PRIORIDADE_ROTULOS[ocorrencia.prioridade]}
          {ocorrencia.localizacao ? ` · ${ocorrencia.localizacao}` : ""}
        </p>
        <p className="texto-ajuda">
          Solicitado por {ocorrencia.solicitante_nome} em {formatarData(ocorrencia.criado_em)}
          {ocorrencia.responsavel_nome ? ` · Responsável: ${ocorrencia.responsavel_nome}` : ""}
        </p>

        <p>{ocorrencia.descricao}</p>

        {ocorrencia.imagem_tipo && (
          <img
            className="imagem-ocorrencia"
            src={`/api/ocorrencias/${id}/imagem`}
            alt="Foto anexada à ocorrência"
          />
        )}

        {ocorrencia.solucao && (
          <div>
            <strong>Solução aplicada:</strong>
            <p>{ocorrencia.solucao}</p>
          </div>
        )}

        {erro && <p className="erro">{erro}</p>}

        {ehDono && ocorrencia.status === "aberta" && (
          <button className="perigo" onClick={cancelarComoSolicitante}>
            Cancelar ocorrência
          </button>
        )}
      </div>

      {ehGestor && (
        <div className="bloco">
          <h3>Gestão da ocorrência</h3>

          <form onSubmit={salvarGestao}>
            <div className="campo">
              <label htmlFor="prioridade">Prioridade</label>
              <select
                id="prioridade"
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value)}
              >
                {Object.entries(PRIORIDADE_ROTULOS).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>
                    {rotulo}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="responsavel">Responsável</label>
              <select
                id="responsavel"
                value={responsavelId}
                onChange={(e) => setResponsavelId(e.target.value)}
              >
                <option value="">Sem responsável definido</option>
                {gestores.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="solucao">Solução aplicada</label>
              <textarea
                id="solucao"
                rows={3}
                value={solucao}
                onChange={(e) => setSolucao(e.target.value)}
              />
            </div>

            <button type="submit">Salvar</button>
          </form>

          {transicoesPossiveis.length > 0 && (
            <form onSubmit={atualizarStatus} style={{ marginTop: 20 }}>
              <div className="campo">
                <label htmlFor="novoStatus">Mudar status para</label>
                <select
                  id="novoStatus"
                  value={novoStatus}
                  onChange={(e) => setNovoStatus(e.target.value)}
                  required
                >
                  <option value="">Selecione...</option>
                  {transicoesPossiveis.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_ROTULOS[s]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo">
                <label htmlFor="observacao">Observação</label>
                <textarea
                  id="observacao"
                  rows={2}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </div>

              <button type="submit">Atualizar status</button>
            </form>
          )}
        </div>
      )}

      {ehDono && ocorrencia.status === "resolvida" && (
        <div className="bloco">
          <h3>Avaliação</h3>

          {ocorrencia.avaliacao_nota ? (
            <div>
              <p className="estrelas">
                {"★".repeat(ocorrencia.avaliacao_nota)}
                {"☆".repeat(5 - ocorrencia.avaliacao_nota)}
              </p>
              {ocorrencia.avaliacao_comentario && <p>{ocorrencia.avaliacao_comentario}</p>}
            </div>
          ) : (
            <form onSubmit={enviarAvaliacao}>
              <div className="campo">
                <label htmlFor="nota">Nota (1 a 5)</label>
                <select id="nota" value={nota} onChange={(e) => setNota(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo">
                <label htmlFor="comentarioAvaliacao">Comentário (opcional)</label>
                <textarea
                  id="comentarioAvaliacao"
                  rows={2}
                  value={comentarioAvaliacao}
                  onChange={(e) => setComentarioAvaliacao(e.target.value)}
                />
              </div>

              <button type="submit">Enviar avaliação</button>
            </form>
          )}
        </div>
      )}

      <div className="bloco">
        <h3>Comentários</h3>

        {ocorrencia.comentarios.length === 0 && (
          <p className="texto-ajuda">Nenhum comentário ainda.</p>
        )}

        {ocorrencia.comentarios.map((c) => (
          <div className="comentario" key={c.id}>
            <p className="autor">
              {c.usuario_nome} ({c.usuario_perfil}) · {formatarData(c.criado_em)}
            </p>
            <p className="texto">{c.texto}</p>
          </div>
        ))}

        <form onSubmit={enviarComentario} style={{ marginTop: 12 }}>
          <div className="campo">
            <textarea
              rows={2}
              placeholder="Escreva um comentário..."
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
            />
          </div>
          <button type="submit">Comentar</button>
        </form>
      </div>

      <div className="bloco">
        <h3>Histórico</h3>
        {ocorrencia.historico.map((h) => (
          <div className="linha-historico" key={h.id}>
            <div>
              {h.status_anterior ? `${STATUS_ROTULOS[h.status_anterior]} → ` : ""}
              <strong>{STATUS_ROTULOS[h.status_novo] || h.status_novo}</strong>
            </div>
            <small>
              {h.usuario_nome} · {formatarData(h.criado_em)}
              {h.observacao ? ` · ${h.observacao}` : ""}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}
