import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import StatusBadge from "../components/StatusBadge";
import { PRIORIDADE_ROTULOS, rotuloCategoria } from "../constants";
import type { OcorrenciaResumo } from "../types";

export default function MinhasOcorrencias() {
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api
      .get("/ocorrencias")
      .then(setOcorrencias)
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Minhas ocorrências</h2>
        <Link to="/ocorrencias/nova" className="botao" style={{ textDecoration: "none" }}>
          + Nova ocorrência
        </Link>
      </div>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="erro">{erro}</p>}

      {!carregando && ocorrencias.length === 0 && (
        <p className="texto-ajuda">Você ainda não registrou nenhuma ocorrência.</p>
      )}

      <div className="lista-ocorrencias">
        {ocorrencias.map((o) => (
          <Link to={`/ocorrencias/${o.id}`} className="card-ocorrencia" key={o.id}>
            <div>
              <p className="titulo">{o.titulo}</p>
              <p className="detalhes">
                {rotuloCategoria(o.categoria)} · Prioridade {PRIORIDADE_ROTULOS[o.prioridade]}
                {o.localizacao ? ` · ${o.localizacao}` : ""}
              </p>
            </div>
            <StatusBadge status={o.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
