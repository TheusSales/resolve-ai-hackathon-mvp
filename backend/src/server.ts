// Ponto de entrada: prepara o banco e sobe o servidor HTTP.
import app from "./app";
import { migrar } from "./migrate";

const PORT = process.env.PORT || 3000;

migrar()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Não foi possível preparar o banco de dados:", err);
    process.exit(1);
  });
