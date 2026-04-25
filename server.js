require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./database/db");
const app = express();

app.use(cors());
app.use(express.json());

//rotas
app.use("/api/agente", require("./routes/agente"));
app.use("/api/usuarios", require("./routes/usuarios"));
app.use("/api/recomendacoes", require("./routes/recomendacoes"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", database: "SQLite local" });
});

//rota pra poder colocar alguns dados de exemplos ne kkk
app.post("/api/seed", (req, res) => {
  const projetosExemplo = [
    {
      titulo: "Aula de Programação para Jovens",
      descricao:
        "Ensinar programação básica para jovens de comunidades carentes",
      organizacao: "Code for Good",
      localizacao: "São Paulo, SP",
      tipo_ajuda: JSON.stringify(["programação", "ensino", "mentoria"]),
      categoria: "educação",
      urgencia: 3,
      vagas: 5,
    },
    {
      titulo: "Reconstrução Pós-Enchente",
      descricao: "Ajuda na reconstrução de casas afetadas por enchentes",
      organizacao: "Ajuda Solidária",
      localizacao: "Rio Grande do Sul",
      tipo_ajuda: JSON.stringify([
        "construção",
        "enfermagem",
        "cozinha",
        "logística",
      ]),
      categoria: "catástrofe",
      urgencia: 5,
      vagas: 20,
    },
    {
      titulo: "Design para ONGs",
      descricao: "Criar identidade visual e materiais para ONGs locais",
      organizacao: "Design do Bem",
      localizacao: "remoto",
      tipo_ajuda: JSON.stringify(["design", "marketing", "redação"]),
      categoria: "assistência social",
      urgencia: 2,
      vagas: 3,
    },
  ];

  const insert = db.prepare(`
    INSERT INTO projetos (titulo, descricao, organizacao, localizacao, tipo_ajuda, categoria, urgencia, vagas)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  projetosExemplo.forEach((p) =>
    insert.run(
      p.titulo,
      p.descricao,
      p.organizacao,
      p.localizacao,
      p.tipo_ajuda,
      p.categoria,
      p.urgencia,
      p.vagas,
    ),
  );

  res.json({ mensagem: "Dados de exemplo inseridos!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`SQLITE ta ai ó ./database.sqlite`);
});
