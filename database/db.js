const DataBase = require("better-sqlite3");
const path = require("path");
const db = new DataBase(path.join(__dirname, "../database.sqlite"));

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    telefone TEXT,
    data_nascimento TEXT,
    genero TEXT,
    cep TEXT,
    endereco TEXT,
    cidade TEXT,
    estado TEXT,
    localizacao TEXT,            -- ✅ ADICIONADO
    habilidades TEXT,        -- JSON array: ["programação", "design", "cozinha"]
    disponibilidade TEXT,    -- "semanal", "fim_de_semana", "eventual"
    areas_interesse TEXT,    -- JSON array: ["educação", "saúde", "meio_ambiente"]
    experiencia TEXT,        -- "iniciante", "intermediário", "avancado"
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projetos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descricao TEXT,
    organizacao TEXT,
    localizacao TEXT,
    tipo_ajuda TEXT,         -- JSON array de habilidades necessárias
    categoria TEXT,          -- "educação", "saúde", "catástrofe", etc.
    urgencia INTEGER,        -- 1-5 (5 = máxima urgência)
    vagas INTEGER,
    status TEXT DEFAULT 'ativo',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS comunidades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT,
    localizacao TEXT,
    necessidades TEXT,       -- JSON array
    contato TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    projeto_id INTEGER,
    score REAL,              -- Score de compatibilidade 0-100
    status TEXT DEFAULT 'sugerido',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (projeto_id) REFERENCES projetos(id)
  );
`);

console.log("Banco de dados inicializado 🙌");
module.exports = db;
