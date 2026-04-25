const express = require("express");
const router = express.Router();
const db = require("../database/db");

//cria usuario
router.post("/", (req, res) => {
  try {
    const {
      nome,
      email,
      telefone,
      localizacao,
      habilidades,
      disponibilidade,
      areas_interesse,
      experiencia,
    } = req.body;

    const result = db
      .prepare(
        `INSERT INTO usuarios (nome, email, telefone, localizacao, habilidades, disponibilidade, areas_interesse, experiencia)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        nome,
        email,
        telefone,
        localizacao,
        JSON.stringify(habilidades || []),
        disponibilidade,
        JSON.stringify(areas_interesse || []),
        experiencia,
      );

    res.status(201).json({
      id: result.lastInsertRowid,
      mensagem: "Usuário criado com sucesso 😎",
    });
  } catch (error) {
    if (error.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ erro: "Email já cadastrado" });
    }
    res.status(500).json({ erro: error.message });
  }
});

//procurar por id
router.get("/:id", (req, res) => {
  const usuario = db
    .prepare("SELECT * FROM usuarios WHERE id = ?")
    .get(req.params.id);

  if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });

  usuario.habilidades = JSON.parse(usuario.habilidades || "[]");
  usuario.areas_interesse = JSON.parse(usuario.areas_interesse || "[]");

  res.json(usuario);
});

module.exports = router;
