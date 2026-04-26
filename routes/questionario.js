
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const db = require("../database/db");
 
// ============================================
// HELPERS
// ============================================
 
// Unificado — era parseHabilidades + parseAreasInteresse (idênticas)
function parseTextoLista(texto) {
  if (!texto) return [];
  return texto
    .split(/[,;]/)
    .map((h) => h.trim().toLowerCase())
    .filter((h) => h.length > 0);
}
 
function mapearExperiencia(opcao) {
  const map = {
    A: "iniciante",
    B: "intermediario",
    C: "avancado",
    D: "especialista", // era "avancado" — perdia a distinção do nível D
  };
  return map[opcao] || "iniciante";
}
 
function mapearDisponibilidade(opcao) {
  const map = {
    A: "eventual",
    B: "fim_de_semana",
    C: "semanal",
    D: "semanal",
  };
  return map[opcao] || "eventual";
}
 
// ============================================
// ALGORITMO DE SCORE
// ============================================
 
function calculaScore(usuario, projeto) {
  let score = 0;
  const pesos = {
    habilidades: 40,
    localizacao: 25,
    interesses: 20,
    disponibilidade: 15,
  };
 
  // Habilidades
  const habilidadesUsuario = JSON.parse(usuario.habilidades || "[]");
  const habilidadesProjeto = JSON.parse(projeto.tipo_ajuda || "[]");
  const matchHabilidades = habilidadesUsuario.filter((h) =>
    habilidadesProjeto.some((hp) => hp.toLowerCase().includes(h.toLowerCase()))
  );
  score +=
    (matchHabilidades.length / Math.max(habilidadesProjeto.length, 1)) *
    pesos.habilidades;
 
  // Localização
  if (usuario.localizacao && projeto.localizacao) {
    const locUser = usuario.localizacao.toLowerCase();
    const locProj = projeto.localizacao.toLowerCase();
    if (
      locUser === locProj ||
      locProj.includes(locUser) ||
      locUser.includes(locProj)
    ) {
      score += pesos.localizacao;
    } else if (locProj === "remoto" || locProj === "online") {
      score += pesos.localizacao * 0.8;
    }
  }
 
  // Áreas de interesse
  const interessesUsuario = JSON.parse(usuario.areas_interesse || "[]");
  if (
    interessesUsuario.some((i) =>
      projeto.categoria?.toLowerCase().includes(i.toLowerCase())
    )
  ) {
    score += pesos.interesses;
  }
 
  // Disponibilidade
  if (
    usuario.disponibilidade === "semanal" ||
    usuario.disponibilidade === "fim_de_semana"
  ) {
    score += pesos.disponibilidade;
  } else if (usuario.disponibilidade === "eventual") {
    score += pesos.disponibilidade * 0.6;
  }
 
  // Urgência como bônus proporcional (máx 10 pontos, mas só aplicado ANTES do cap)
  // Era: adicionado fora do Math.min, podendo distorcer o score base
  const urgenciaBonus = ((projeto.urgencia || 1) / 5) * 10;
  const scoreTotal = score + urgenciaBonus;
 
  return Math.min(Math.round(scoreTotal), 100);
}
 
// ============================================
// ROTA POST /
// ============================================
 
router.post("/", (req, res) => {
  const {
    habilidades,
    experiencia_opcao,
    disponibilidade_opcao,
    areas_interesse,
    nome,
    email,
    localizacao,
  } = req.body;
 
  // Validação de entrada — antes era silenciosa
  if (!habilidades || habilidades.trim().length === 0) {
    return res.status(400).json({ erro: "O campo 'habilidades' é obrigatório." });
  }
  if (!areas_interesse || areas_interesse.trim().length === 0) {
    return res.status(400).json({ erro: "O campo 'areas_interesse' é obrigatório." });
  }
  if (!experiencia_opcao || !["A", "B", "C", "D"].includes(experiencia_opcao)) {
    return res.status(400).json({ erro: "Opção de experiência inválida. Use A, B, C ou D." });
  }
  if (!disponibilidade_opcao || !["A", "B", "C", "D"].includes(disponibilidade_opcao)) {
    return res.status(400).json({ erro: "Opção de disponibilidade inválida. Use A, B, C ou D." });
  }
 
  const experiencia = mapearExperiencia(experiencia_opcao);
  const disponibilidade = mapearDisponibilidade(disponibilidade_opcao);
  const habilidadesArray = parseTextoLista(habilidades);
  const areasArray = parseTextoLista(areas_interesse);
 
  const usuarioNome = nome?.trim() || "Usuário Anônimo";
  // Era Date.now() — colisão possível em requisições simultâneas
  const usuarioEmail = email?.trim() || `anon_${crypto.randomUUID()}@quiz.local`;
  const usuarioLocalizacao = localizacao?.trim() || "";
 
  try {
    // Transação garante atomicidade — antes cada INSERT era independente
    // Se os matches falhassem, o usuário ficava salvo sem nenhum match
    const resultado = db.transaction(() => {
      const insert = db.prepare(`
        INSERT INTO usuarios (nome, email, telefone, localizacao, habilidades, disponibilidade, areas_interesse, experiencia)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
 
      const result = insert.run(
        usuarioNome,
        usuarioEmail,
        null,
        usuarioLocalizacao,
        JSON.stringify(habilidadesArray),
        disponibilidade,
        JSON.stringify(areasArray),
        experiencia
      );
 
      const usuarioId = result.lastInsertRowid;
      const usuario = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(usuarioId);
 
      const projetos = db
        .prepare(`SELECT * FROM projetos WHERE status = 'ativo' AND (vagas IS NULL OR vagas > 0)`)
        .all();
 
      const recomendacoes = projetos
        .map((projeto) => ({
          projeto,
          score: calculaScore(usuario, projeto),
          match_habilidades: habilidadesArray.filter((h) =>
            JSON.parse(projeto.tipo_ajuda || "[]").some((hp) =>
              hp.toLowerCase().includes(h.toLowerCase())
            )
          ),
        }))
        .filter((r) => r.score > 20)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
 
      const insertMatch = db.prepare(`
        INSERT OR IGNORE INTO matches (usuario_id, projeto_id, score, status)
        VALUES (?, ?, ?, 'sugerido')
      `);
      // INSERT OR IGNORE respeita o índice único em matches(usuario_id, projeto_id)
      // caso o db.js já tenha o UNIQUE INDEX criado
 
      recomendacoes.forEach((r) => {
        insertMatch.run(usuarioId, r.projeto.id, r.score);
      });
 
      return { usuarioId, recomendacoes };
    })();
 
    res.status(201).json({
      mensagem: "Questionário enviado com sucesso!",
      usuario_id: resultado.usuarioId,
      recomendacoes: resultado.recomendacoes,
      total_encontrado: resultado.recomendacoes.length,
    });
  } catch (error) {
    console.error("Erro no questionário:", error);
 
    // Email duplicado é um erro esperado, merece resposta específica
    if (error.message?.includes("UNIQUE constraint failed: usuarios.email")) {
      return res.status(409).json({ erro: "Este e-mail já está cadastrado." });
    }
 
    res.status(500).json({ erro: "Erro ao processar questionário." });
  }
});
 
module.exports = router;