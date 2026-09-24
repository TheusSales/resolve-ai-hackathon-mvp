import { Link, useNavigate } from "react-router-dom";
import { encerrarSessao, getUsuario } from "../api";

export default function Navbar() {
  const usuario = getUsuario();
  const navigate = useNavigate();

  function sair() {
    encerrarSessao();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <Link to="/" className="marca">
        Resolve Aí
      </Link>

      <nav>
        {usuario && usuario.perfil === "solicitante" && (
          <>
            <Link to="/ocorrencias">Minhas ocorrências</Link>
            <Link to="/ocorrencias/nova">Nova ocorrência</Link>
          </>
        )}

        {usuario && usuario.perfil === "gestor" && (
          <>
            <Link to="/ocorrencias">Todas as ocorrências</Link>
            <Link to="/dashboard">Dashboard</Link>
          </>
        )}

        {usuario ? (
          <>
            <span className="texto-ajuda">
              {usuario.nome} ({usuario.perfil})
            </span>
            <button className="secundario" onClick={sair}>
              Sair
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Entrar</Link>
            <Link to="/cadastro">Criar conta</Link>
          </>
        )}
      </nav>
    </header>
  );
}
