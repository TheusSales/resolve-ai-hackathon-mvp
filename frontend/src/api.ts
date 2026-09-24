// Funções simples para conversar com a API do backend.
// O token do usuário fica guardado no localStorage do navegador.

const CHAVE_TOKEN = "resolveai_token";
const CHAVE_USUARIO = "resolveai_usuario";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: "solicitante" | "gestor";
}

export function salvarSessao(usuario: Usuario, token: string) {
  localStorage.setItem(CHAVE_TOKEN, token);
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

export function encerrarSessao() {
  localStorage.removeItem(CHAVE_TOKEN);
  localStorage.removeItem(CHAVE_USUARIO);
}

export function getUsuario(): Usuario | null {
  const dados = localStorage.getItem(CHAVE_USUARIO);
  return dados ? JSON.parse(dados) : null;
}

function getToken(): string | null {
  return localStorage.getItem(CHAVE_TOKEN);
}

async function chamarApi(caminho: string, opcoes: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(opcoes.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Se o corpo for FormData (upload de imagem), o navegador define o
  // Content-Type sozinho (com o boundary certo). Para JSON, definimos aqui.
  if (opcoes.body && !(opcoes.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const resposta = await fetch(`/api${caminho}`, { ...opcoes, headers });

  if (resposta.status === 204) {
    return null;
  }

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new Error(dados?.erro || "Não foi possível completar a operação");
  }

  return dados;
}

export const api = {
  get: (caminho: string) => chamarApi(caminho),

  post: (caminho: string, corpo?: unknown) =>
    chamarApi(caminho, {
      method: "POST",
      body: corpo instanceof FormData ? corpo : JSON.stringify(corpo ?? {}),
    }),

  patch: (caminho: string, corpo?: unknown) =>
    chamarApi(caminho, {
      method: "PATCH",
      body: JSON.stringify(corpo ?? {}),
    }),
};
