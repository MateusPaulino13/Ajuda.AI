require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./database/db");
const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  }),
);

app.use(express.json());

// ============================================
//! ROTAS DA API
// ============================================

app.use("/api/agente", require("./routes/agente"));
app.use("/api/usuarios", require("./routes/usuario"));
app.use("/api/recomendacoes", require("./routes/recomendacao"));
app.use("/api/questionario", require("./routes/questionario"));

// ============================================
//! HEALTH CHECK
// ============================================

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    database: "SQLite local",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ============================================
//! SEED DE DADOS (para testes)
// ============================================

app.post("/api/seed", (req, res) => {
  try {
    // ✅ Limpar dados antigos
    db.exec("DELETE FROM matches");
    db.exec("DELETE FROM projetos");

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

    res.json({
      mensagem: "Dados de exemplo inseridos!",
      projetos_inseridos: projetosExemplo.length,
    });
  } catch (error) {
    console.error("Erro ao fazer seed:", error);
    res.status(500).json({ erro: error.message });
  }
});

// ============================================
//! MIDDLEWARE DE ERRO
// ============================================

app.use((err, req, res, next) => {
  console.error("Erro não tratado:", err);
  res.status(500).json({
    erro: "Erro interno do servidor",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ============================================
//! INICIAR SERVIDOR
// ============================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║         🌍 AJUDA.AI - SERVIDOR        ║
╚════════════════════════════════════════╝

✅ Servidor rodando em http://localhost:${PORT}
✅ Banco de dados: ./database.sqlite
✅ Ambiente: ${process.env.NODE_ENV || "development"}

📚 ROTAS DISPONÍVEIS:
  GET  /health                          - Verificar status
  POST /api/seed                        - Carregar dados de exemplo
  
  POST /api/usuarios/register           - Registrar novo usuário
  POST /api/usuarios/login              - Login de usuário
  GET  /api/usuarios/:id                - Obter dados do usuário
  PUT  /api/usuarios/:id                - Atualizar usuário
  
  POST /api/questionario                - Enviar respostas do quiz
  GET  /api/recomendacoes/usuario/:id   - Obter recomendações do usuário
  GET  /api/recomendacoes/projetos      - Filtrar projetos
  
  POST /api/agente/conversar            - Chat com agente IA
  GET  /api/agente/onboarding/:etapa    - Próxima pergunta

  `);
});
