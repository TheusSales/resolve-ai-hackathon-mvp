// Conexão com o banco Postgres usando um pool de conexões simples.
import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://resolveai:resolveai@localhost:5432/resolveai";

// Quando a string de conexão pede SSL (caso comum em bancos gerenciados na
// nuvem), ativamos o SSL mas sem validar o certificado, para simplificar.
const precisaSSL = connectionString.includes("sslmode=require");

export const pool = new Pool({
  connectionString,
  ssl: precisaSSL ? { rejectUnauthorized: false } : undefined,
});

export default pool;
