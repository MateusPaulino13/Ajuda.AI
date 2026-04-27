const express = require("express");
const router = express.Router();
const db = require("../database/db");
const bcrypt = require("bcryptjs");

// Registro de usuário (com senha)
router.post("/register", async (req, res) => {
  try {
    const {
      nome,
      email,
      senha,
      telefone,
      data_nascimento,
      genero,
      cep,
      endereco,
      cidade,
      estado,
      habilidades,
      disponibilidade,
      areas_interesse,
      experiencia,
    } = req.body;

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const result = db
      .prepare(
        `INSERT INTO usuarios (nome, email, senha, telefone, data_nascimento, genero, cep, endereco, cidade, estado, habilidades, disponibilidade, areas_interesse, experiencia)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        nome,
        email,
        senhaHash,
        telefone,
        data_nascimento,
        genero,
        cep,
        endereco,
        cidade,
        estado,
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

// Login de usuário
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Busca usuário pelo email
    const usuario = db
      .prepare("SELECT * FROM usuarios WHERE email = ?")
      .get(email);

    if (!usuario) {
      return res.status(401).json({ erro: "Email ou senha incorretos" });
    }

    // Verifica senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: "Email ou senha incorretos" });
    }

    // Remove senha do retorno
    delete usuario.senha;

    // Converte JSON arrays
    usuario.habilidades = JSON.parse(usuario.habilidades || "[]");
    usuario.areas_interesse = JSON.parse(usuario.areas_interesse || "[]");

    res.json({
      usuario,
      mensagem: "Login realizado com sucesso! 🎉",
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Atualizar informações do usuário
router.put("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const {
      nome,
      telefone,
      data_nascimento,
      genero,
      cep,
      endereco,
      cidade,
      estado,
      habilidades,
      disponibilidade,
      areas_interesse,
      experiencia,
    } = req.body;

    const result = db
      .prepare(
        `UPDATE usuarios 
         SET nome = ?, telefone = ?, data_nascimento = ?, genero = ?, cep = ?, endereco = ?, cidade = ?, estado = ?, habilidades = ?, disponibilidade = ?, areas_interesse = ?, experiencia = ?
         WHERE id = ?`
      )
      .run(
        nome,
        telefone,
        data_nascimento,
        genero,
        cep,
        endereco,
        cidade,
        estado,
        JSON.stringify(habilidades || []),
        disponibilidade,
        JSON.stringify(areas_interesse || []),
        experiencia,
        userId,
      );

    if (result.changes === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    res.json({ mensagem: "Informações atualizadas com sucesso! ✅" });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

//cria usuario (legado - manter compatibilidade)
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
