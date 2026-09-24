import type { JSX } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { getUsuario } from "./api";
import Navbar from "./components/Navbar";
import Cadastro from "./pages/Cadastro";
import Dashboard from "./pages/Dashboard";
import DetalheOcorrencia from "./pages/DetalheOcorrencia";
import Login from "./pages/Login";
import MinhasOcorrencias from "./pages/MinhasOcorrencias";
import NovaOcorrencia from "./pages/NovaOcorrencia";
import TodasOcorrencias from "./pages/TodasOcorrencias";

// Só deixa passar se o usuário estiver logado (opcionalmente, só se for gestor).
function RotaProtegida({
  children,
  somenteGestor,
}: {
  children: JSX.Element;
  somenteGestor?: boolean;
}) {
  const usuario = getUsuario();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (somenteGestor && usuario.perfil !== "gestor") {
    return <Navigate to="/ocorrencias" replace />;
  }

  return children;
}

// Página inicial: manda cada perfil para a lista de ocorrências adequada.
function PaginaInicial() {
  const usuario = getUsuario();

  if (!usuario) return <Navigate to="/login" replace />;

  return <Navigate to="/ocorrencias" replace />;
}

// A lista de ocorrências muda conforme o perfil. Importante checar o perfil
// AQUI DENTRO (e não direto no App), senão a checagem roda só uma vez, no
// primeiro carregamento da página (antes do login) e nunca mais se atualiza.
function ListaOcorrencias() {
  const usuario = getUsuario();
  return usuario?.perfil === "gestor" ? <TodasOcorrencias /> : <MinhasOcorrencias />;
}

export default function App() {
  return (
    <Router>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<PaginaInicial />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          <Route
            path="/ocorrencias"
            element={
              <RotaProtegida>
                <ListaOcorrencias />
              </RotaProtegida>
            }
          />

          <Route
            path="/ocorrencias/nova"
            element={
              <RotaProtegida>
                <NovaOcorrencia />
              </RotaProtegida>
            }
          />

          <Route
            path="/ocorrencias/:id"
            element={
              <RotaProtegida>
                <DetalheOcorrencia />
              </RotaProtegida>
            }
          />

          <Route
            path="/dashboard"
            element={
              <RotaProtegida somenteGestor>
                <Dashboard />
              </RotaProtegida>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}
