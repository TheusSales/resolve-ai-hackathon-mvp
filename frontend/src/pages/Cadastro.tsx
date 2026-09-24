import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, salvarSessao } from "../api";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resposta = await api.post("/auth/register", { nome, email, senha });
      salvarSessao(resposta.usuario, resposta.token);
      navigate("/ocorrencias");
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="form-card">
      <h2>Criar conta</h2>

      <form onSubmit={enviar}>
        <div className="campo">
          <label htmlFor="nome">Nome</label>
          <input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            minLength={6}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>

        {erro && <p className="erro">{erro}</p>}

        <button type="submit" disabled={carregando}>
          {carregando ? "Criando..." : "Criar conta"}
        </button>
      </form>

      <p className="texto-ajuda" style={{ marginTop: 16 }}>
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </div>
  );
}
