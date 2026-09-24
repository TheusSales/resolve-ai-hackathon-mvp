import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import StatusBadge from "../components/StatusBadge";
import { CATEGORIAS, PRIORIDADE_ROTULOS, STATUS_ROTULOS, rotuloCategoria } from "../constants";
import type { OcorrenciaResumo } from "../types";

export default function TodasOcorrencias() {
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("");

  function buscar() {
    setCarregando(true);
    const parametros = new URLSearchParams();
    if (filtroCategoria) parametros.set("categoria", filtroCategoria);
    if (filtroStatus) parametros.set("status", filtroStatus);
    if (filtroPrioridade) parametros.set("prioridade", filtroPrioridade);

    api
      .get(`/ocorrencias?${parametros.toString()}`)
      .then(setOcorrencias)
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false));
  }

  useEffect(buscar, [filtroCategoria, filtroStatus, filtroPrioridade]);

  return (
    <div>
      <h2>Todas as ocorrências</h2>

      <div className="filtros">
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.rotulo}
            </option>
          ))}
        </select>

        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_ROTULOS).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>

        <select value={filtroPrioridade} onChange={(e) => setFiltroPrioridade(e.target.value)}>
          <option value="">Todas as prioridades</option>
          {Object.entries(PRIORIDADE_ROTULOS).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
      </div>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="erro">{erro}</p>}

      {!carregando && ocorrencias.length === 0 && (
        <p className="texto-ajuda">Nenhuma ocorrência encontrada.</p>
      )}

      <div className="lista-ocorrencias">
        {ocorrencias.map((o) => (
          <Link to={`/ocorrencias/${o.id}`} className="card-ocorrencia" key={o.id}>
            <div>
              <p className="titulo">{o.titulo}</p>
              <p className="detalhes">
                {rotuloCategoria(o.categoria)} · Prioridade {PRIORIDADE_ROTULOS[o.prioridade]} ·
                {" "}Solicitado por {o.solicitante_nome}
                {o.responsavel_nome ? ` · Responsável: ${o.responsavel_nome}` : ""}
              </p>
            </div>
            <StatusBadge status={o.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
