import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { CATEGORIAS } from "../constants";

export default function NovaOcorrencia() {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0].valor);
  const [localizacao, setLocalizacao] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    setCarregando(true);

    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("descricao", descricao);
    formData.append("categoria", categoria);
    formData.append("localizacao", localizacao);
    if (imagem) formData.append("imagem", imagem);

    try {
      const ocorrencia = await api.post("/ocorrencias", formData);
      navigate(`/ocorrencias/${ocorrencia.id}`);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="form-card" style={{ maxWidth: 500 }}>
      <h2>Registrar ocorrência</h2>

      <form onSubmit={enviar}>
        <div className="campo">
          <label htmlFor="titulo">Título</label>
          <input
            id="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="descricao">Descrição</label>
          <textarea
            id="descricao"
            rows={4}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="categoria">Categoria</label>
          <select
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            {CATEGORIAS.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.rotulo}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="localizacao">Localização</label>
          <input
            id="localizacao"
            placeholder="Ex: Bloco B, 3º andar"
            value={localizacao}
            onChange={(e) => setLocalizacao(e.target.value)}
          />
        </div>

        <div className="campo">
          <label htmlFor="imagem">Foto (opcional)</label>
          <input
            id="imagem"
            type="file"
            accept="image/*"
            onChange={(e) => setImagem(e.target.files?.[0] || null)}
          />
        </div>

        {erro && <p className="erro">{erro}</p>}

        <button type="submit" disabled={carregando}>
          {carregando ? "Enviando..." : "Registrar ocorrência"}
        </button>
      </form>
    </div>
  );
}
