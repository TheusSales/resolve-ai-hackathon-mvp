// Cria as tabelas do banco automaticamente, se ainda não existirem, toda
// vez que o servidor sobe. Assim não é preciso rodar nada manualmente antes
// do primeiro deploy (nem localmente, nem no Render/Azure/onde for).
import fs from "fs";
import path from "path";
import pool from "./db";

const CAMINHO_SQL = path.join(__dirname, "..", "sql", "init.sql");

export async function migrar(tentativas = 10, esperaMs = 3000): Promise<void> {
  const sql = fs.readFileSync(CAMINHO_SQL, "utf-8");

  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    try {
      await pool.query(sql);
      console.log("Banco de dados pronto.");
      return;
    } catch (err) {
      const ultimaTentativa = tentativa === tentativas;
      console.log(
        `Banco ainda não disponível (tentativa ${tentativa}/${tentativas})${
          ultimaTentativa ? "" : ", tentando de novo em alguns segundos..."
        }`
      );
      if (ultimaTentativa) throw err;
      await new Promise((resolve) => setTimeout(resolve, esperaMs));
    }
  }
}
