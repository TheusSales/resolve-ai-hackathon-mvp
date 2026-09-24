import { useEffect, useState } from "react";
import { api } from "../api";
import { PRIORIDADE_ROTULOS, STATUS_ROTULOS, rotuloCategoria } from "../constants";

interface Contagem {
  total: number;
}

interface DadosDashboard {
  total: number;
  porStatus: (Contagem & { status: string })[];
  porCategoria: (Contagem & { categoria: string })[];
  porPrioridade: (Contagem & { prioridade: string })[];
  mediaAvaliacao: string | null;
}

// Uma barra horizontal bem simples, feita só com divs e width em %.
function Barra({ rotulo, total, maximo }: { rotulo: string; total: number; maximo: number }) {
  const largura = maximo > 0 ? (total / maximo) * 100 : 0;

  return (
    <div className="barra-linha">
      <span className="rotulo-barra">{rotulo}</span>
      <div className="barra-fundo">
        <div className="barra-preenchida" style={{ width: `${largura}%` }} />
      </div>
      <span>{total}</span>
    </div>
  );
}

export default function Dashboard() {
  const [dados, setDados] = useState<DadosDashboard | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get("/dashboard").then(setDados).catch((err) => setErro(err.message));
  }, []);

  if (erro) return <p className="erro">{erro}</p>;
  if (!dados) return <p>Carregando...</p>;

  const maximoStatus = Math.max(...dados.porStatus.map((s) => s.total), 1);
  const maximoCategoria = Math.max(...dados.porCategoria.map((c) => c.total), 1);
  const maximoPrioridade = Math.max(...dados.porPrioridade.map((p) => p.total), 1);

  return (
    <div>
      <h2>Dashboard</h2>

      <div className="cards-resumo">
        <div className="card-resumo">
          <div className="numero">{dados.total}</div>
          <div className="rotulo">Ocorrências no total</div>
        </div>
        <div className="card-resumo">
          <div className="numero">{dados.mediaAvaliacao ?? "-"}</div>
          <div className="rotulo">Nota média das avaliações</div>
        </div>
      </div>

      <div className="bloco">
        <h3>Por status</h3>
        {dados.porStatus.map((s) => (
          <Barra
            key={s.status}
            rotulo={STATUS_ROTULOS[s.status] || s.status}
            total={s.total}
            maximo={maximoStatus}
          />
        ))}
      </div>

      <div className="bloco">
        <h3>Por categoria</h3>
        {dados.porCategoria.map((c) => (
          <Barra
            key={c.categoria}
            rotulo={rotuloCategoria(c.categoria)}
            total={c.total}
            maximo={maximoCategoria}
          />
        ))}
      </div>

      <div className="bloco">
        <h3>Por prioridade</h3>
        {dados.porPrioridade.map((p) => (
          <Barra
            key={p.prioridade}
            rotulo={PRIORIDADE_ROTULOS[p.prioridade] || p.prioridade}
            total={p.total}
            maximo={maximoPrioridade}
          />
        ))}
      </div>
    </div>
  );
}
