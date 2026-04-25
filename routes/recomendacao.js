const express = require("express");
const router = express.Router();
const db = require("../database/db");

function calculaScore(usuario, projeto) {
  let score = 0;
  const pesos = {
    habilidades: 40,
    localizacao: 25,
    interesses: 20,
    disponibilidade: 15,
  };

  // habilidades
  const habilidadesUsuario = JSON.parse(usuario.habilidades || "[]");
  const habilidadesProjeto = JSON.parse(projeto.tipo_ajuda || "[]");
  const matchHabilidades = habilidadesUsuario.filter((h) =>
    habilidadesProjeto.some((hp) => hp.toLowerCase().includes(h.toLowerCase())),
  );
  score +=
    (matchHabilidades.length / Math.max(habilidadesProjeto.length, 1)) *
    pesos.habilidades;

  // localização
  if (usuario.localizacao && projeto.localizacao) {
    const locUser = usuario.localizacao.toLowerCase();
    const locProj = projeto.localizacao.toLowerCase();
    if (
      locUser === locProj ||
      locProj.includes(locUser) ||
      locUser.includes(locProj)
    ) {
      score += pesos.localizacao;
    } else if (
      projeto.localizacao === "remoto" ||
      projeto.localizacao === "online"
    ) {
      score += pesos.localizacao * 0.8;
    }
  }

  // interesse
  const interessesUsuario = JSON.parse(usuario.areas_interesse || "[]");
  if (
    interessesUsuario.some((i) =>
      projeto.categoria?.toLowerCase().includes(i.toLowerCase()),
    )
  ) {
    score += pesos.interesses;
  }

  // disponibilidade
  if (
    usuario.disponibilidade === "semanal" ||
    usuario.disponibilidade === "fim_de_semana"
  ) {
    score += pesos.disponibilidade;
  } else if (usuario.disponibilidade === "eventual") {
    score += pesos.disponibilidade * 0.6;
  }

  //urgencia (urgentes sobem no ranking)
  const urgenciaBonus = (projeto.urgencia || 1) * 2;

  return Math.min(Math.round(score + urgenciaBonus), 100);
}

// gera recomendações para um usuário
router.get("/usuario/:usuarioId", (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { limite = 10 } = req.query;

    // procura usuario
    const usuario = db
      .prepare("SELECT * FROM usuarios WHERE id = ?")
      .get(usuarioId);
    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    // procura por projetos ativos
    const projetos = db
      .prepare(
        `
      SELECT * FROM projetos 
      WHERE status = 'ativo' 
      AND (vagas IS NULL OR vagas > 0)
    `,
      )
      .all();

    // calcula score
    const recomendacoes = projetos
      .map((projeto) => ({
        projeto,
        score: calculaScore(usuario, projeto),
        match_habilidades: JSON.parse(usuario.habilidades || "[]").filter((h) =>
          JSON.parse(projeto.tipo_ajuda || "[]").some((hp) =>
            hp.toLowerCase().includes(h.toLowerCase()),
          ),
        ),
      }))
      .filter((r) => r.score > 30) // mostra os mais relevantes tlgd
      .sort((a, b) => b.score - a.score)
      .slice(0, parseInt(limite));

    // salvar matches
    const insertMatch = db.prepare(`
      INSERT OR REPLACE INTO matches (usuario_id, projeto_id, score, status)
      VALUES (?, ?, ?, 'sugerido')
    `);

    recomendacoes.forEach((r) => {
      insertMatch.run(usuarioId, r.projeto.id, r.score);
    });

    res.json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        habilidades: JSON.parse(usuario.habilidades || "[]"),
        localizacao: usuario.localizacao,
      },
      recomendacoes,
      total_encontrado: recomendacoes.length,
    });
  } catch (error) {
    console.error("Erro nas recomendações:", error);
    res.status(500).json({ erro: "Erro ao gerar recomendações" });
  }
});

// pesquisar por filtros
router.get("/projetos", (req, res) => {
  const { categoria, localizacao, habilidade, urgencia } = req.query;

  let query = "SELECT * FROM projetos WHERE status = ?";
  const params = ["ativo"];

  if (categoria) {
    query += " AND categoria LIKE ?";
    params.push(`%${categoria}%`);
  }
  if (localizacao) {
    query += " AND (localizacao LIKE ? OR localizacao = ?)";
    params.push(`%${localizacao}%`, "remoto");
  }
  if (habilidade) {
    query += " AND tipo_ajuda LIKE ?";
    params.push(`%${habilidade}%`);
  }
  if (urgencia) {
    query += " AND urgencia >= ?";
    params.push(urgencia);
  }

  query += " ORDER BY urgencia DESC, criado_em DESC";

  const projetos = db.prepare(query).all(...params);
  res.json(projetos);
});

module.exports = router;
