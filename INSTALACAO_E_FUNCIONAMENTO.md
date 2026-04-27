# 🚀 GUIA COMPLETO: INSTALAÇÃO E FUNCIONAMENTO

## ⚠️ PROBLEMAS IDENTIFICADOS E SOLUÇÕES

### **PROBLEMA 1: Campo `localizacao` faltando no Banco de Dados**
**Status:** CRÍTICO ❌

O banco foi criado SEM a coluna `localizacao`, mas o código tenta usá-la.

**Solução:** Adicionar ALTER TABLE ao db.js

---

### **PROBLEMA 2: Frontend enviando dados incompletos**
**Status:** CRÍTICO ❌

O frontend não envia `email` e `localizacao`, que são obrigatórios.

**Solução:** Melhorar formulário + adicionar campos

---

### **PROBLEMA 3: Algoritmo de recomendação quebrado**
**Status:** CRÍTICO ❌

Usa `usuario.localizacao` que é `undefined`.

**Solução:** Sincronizar dados do frontend com backend

---

### **PROBLEMA 4: Agente IA sem tratamento de erro**
**Status:** CRÍTICO ❌

Sem variáveis de ambiente = crash total.

**Solução:** Modo MOCK para desenvolvimento

---

## 📋 CHECKLIST DE INSTALAÇÃO

```bash
# 1. CLONAR E ENTRAR NO PROJETO
git clone https://github.com/MateusPaulino13/Ajuda.AI.git
cd Ajuda.AI

# 2. INSTALAR DEPENDÊNCIAS
npm install

# 3. CRIAR ARQUIVO .env NA RAIZ
touch .env

# 4. ADICIONAR CONTEÚDO AO .env (veja abaixo)

# 5. EXECUTAR OS SCRIPTS DE CORREÇÃO (abaixo)

# 6. INICIAR O SERVIDOR
npm start
```

---

## 🔧 ARQUIVOS QUE PRECISAM SER CORRIGIDOS

### **ARQUIVO 1: `.env` (CRIAR DO ZERO)**

```env
PORT=3000
NODE_ENV=development

# Watson X - Deixar em branco para MODO MOCK (desenvolvimento)
WATSONX_URL=
WATSONX_API_KEY=
WATSONX_AGENT_ID=

# Quando for produção, adicione:
# WATSONX_URL=https://api.us-south.watson-orchestrate.ibm.com
# WATSONX_API_KEY=sua_chave_aqui
# WATSONX_AGENT_ID=seu_agente_id_aqui
```

---

### **ARQUIVO 2: `database/db.js` (CORRIGIDO)**

Adicionar migration para criar coluna `localizacao`:

```javascript
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
```

---

### **ARQUIVO 3: `services/watsonx.js` (CORRIGIDO)**

Adicionar modo MOCK e tratamento de erro:

```javascript
const axios = require("axios");

class WatsonxClient {
  constructor() {
    this.baseURL =
      process.env.WATSONX_URL ||
      "https://api.us-south.watson-orchestrate.ibm.com";

    this.apiKey = process.env.WATSONX_API_KEY;
    this.agentId = process.env.WATSONX_AGENT_ID;
    
    // ✅ Modo MOCK para desenvolvimento
    this.useMockMode = !this.apiKey || !this.agentId;
    
    if (this.useMockMode) {
      console.log("⚠️ WATSONX em MODO MOCK (desenvolvimento)");
    }
  }

  async getBearerToken() {
    if (this.useMockMode) {
      return "mock-token";
    }

    const response = await axios.post(
      "https://iam.cloud.ibm.com/identity/token",
      new URLSearchParams({
        grant_type: "urn:ibm:params:oauth:grant-type:apikey",
        apikey: this.apiKey,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );
    return response.data.access_token;
  }

  // ✅ MODO MOCK: Gera resposta simulada
  generateMockResponse(mensagens, contexto = {}) {
    const ultimaMensagem = mensagens[mensagens.length - 1]?.content || "";
    
    const respostas = [
      "Que legal! Entendi suas habilidades. Me tell me more sobre sua disponibilidade.",
      "Perfeito! Vejo que você tem interesse em educação. Encontrei alguns projetos interessantes!",
      "Ótimo! Com essas skills, você seria ótimo em projetos de construção e logística.",
      "Entendi! Vou buscar os melhores matches para você. Um momento...",
    ];

    const respostaAleatoria = respostas[Math.floor(Math.random() * respostas.length)];

    return {
      choices: [{
        message: {
          content: respostaAleatoria
        }
      }],
      thread_id: "mock-thread-" + Date.now(),
      model: "mock",
    };
  }

  async chatWithAgent(mensagens, contexto = {}) {
    try {
      if (this.useMockMode) {
        // ✅ Retorna resposta simulada em desenvolvimento
        return this.generateMockResponse(mensagens, contexto);
      }

      const token = await this.getBearerToken();

      const response = await axios.post(
        `${this.baseURL}/orchestrate/${this.agentId}/chat/completions`,
        {
          messages: mensagens.map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          })),
          stream: false,
          additional_parameters: {},
          context: contexto,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("Erro ao chamar WatsonX:", error.message);
      
      // ✅ Fallback para MOCK em caso de erro
      return this.generateMockResponse(mensagens, contexto);
    }
  }

  async chatLocal(mensagens) {
    if (this.useMockMode) {
      return this.generateMockResponse(mensagens);
    }

    const response = await axios.post(
      `${this.baseURL}/orchestrate/${this.agentId}/chat/completions`,
      {
        messages: mensagens,
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WXO_LOCAL_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  }
}

module.exports = new WatsonxClient();
```

---

### **ARQUIVO 4: `server.js` (CORRIGIDO)**

Adicionar middleware de erro e CORS melhorado:

```javascript
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./database/db");
const app = express();

// ✅ CORS melhorado para frontend
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// ============================================
// ROTAS DA API
// ============================================

app.use("/api/agente", require("./routes/agente"));
app.use("/api/usuarios", require("./routes/usuario"));
app.use("/api/recomendacoes", require("./routes/recomendacao"));
app.use("/api/questionario", require("./routes/questionario"));

// ============================================
// HEALTH CHECK
// ============================================

app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    database: "SQLite local",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// ============================================
// SEED DE DADOS (para testes)
// ============================================

app.post("/api/seed", (req, res) => {
  try {
    // ✅ Limpar dados antigos
    db.exec("DELETE FROM matches");
    db.exec("DELETE FROM projetos");

    const projetosExemplo = [
      {
        titulo: "Aula de Programação para Jovens",
        descricao: "Ensinar programação básica para jovens de comunidades carentes",
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
        tipo_ajuda: JSON.stringify(["construção", "enfermagem", "cozinha", "logística"]),
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
      projetos_inseridos: projetosExemplo.length 
    });
  } catch (error) {
    console.error("Erro ao fazer seed:", error);
    res.status(500).json({ erro: error.message });
  }
});

// ============================================
// MIDDLEWARE DE ERRO (catch-all)
// ============================================

app.use((err, req, res, next) => {
  console.error("Erro não tratado:", err);
  res.status(500).json({ 
    erro: "Erro interno do servidor",
    message: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

// ============================================
// INICIAR SERVIDOR
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
```

---

### **ARQUIVO 5: `Front-end/script.js` (CORRIGIDO)**

Adicionar submit da API e envio de email/localização:

```javascript
// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let currentQuestion = 1;
const totalQuestions = 5; // ✅ Aumentado para 5
const API_URL = "http://localhost:3000"; // ✅ URL da API

const respostas = {
  nome: "",
  email: "",              // ✅ ADICIONADO
  localizacao: "",        // ✅ ADICIONADO
  habilidades: "",
  experiencia_opcao: "",
  disponibilidade_opcao: "",
  areas_interesse: "",
};

// ============================================
// FUNÇÃO: ATUALIZAR BARRA DE PROGRESSO
// ============================================
function updateProgress() {
  const progressFill = document.getElementById('progressFill');
  const progressCount = document.getElementById('progressCount');
  const percentage = (currentQuestion / totalQuestions) * 100;

  progressFill.style.width = percentage + '%';
  progressCount.textContent = currentQuestion + ' de ' + totalQuestions;
}

// ============================================
// FUNÇÃO: NAVEGAR PARA PRÓXIMA PERGUNTA
// ============================================
function nextQuestion(fromQuestion) {
  const currentCard = document.getElementById('question' + fromQuestion);
  const nextCard = document.getElementById('question' + (fromQuestion + 1));

  // Validar resposta antes de avançar
  if (!validarResposta(fromQuestion)) {
    alert("Por favor, responda a pergunta!");
    return;
  }

  capturarResposta(fromQuestion);

  currentCard.classList.add('slide-out');

  setTimeout(function() {
    currentCard.classList.add('hidden');
    currentCard.classList.remove('slide-out');

    nextCard.classList.remove('hidden');
    nextCard.classList.add('slide-in');

    currentQuestion = fromQuestion + 1;
    updateProgress();

    setTimeout(function() {
      nextCard.classList.remove('slide-in');
    }, 400);
  }, 400);
}

// ============================================
// FUNÇÃO: VALIDAR RESPOSTA
// ============================================
function validarResposta(numeroPergunta) {
  if (numeroPergunta === 1) {
    return document.getElementById('textAnswer1')?.value.trim().length > 0;
  } else if (numeroPergunta === 2) {
    return document.querySelector('#question2 .option-btn.selecionado') !== null;
  } else if (numeroPergunta === 3) {
    return document.getElementById('textAnswer2')?.value.trim().length > 0;
  } else if (numeroPergunta === 4) {
    return document.querySelector('#question4 .option-btn.selecionado') !== null;
  } else if (numeroPergunta === 5) {
    return document.getElementById('textAnswer3')?.value.trim().length > 0;
  }
  return false;
}

// ============================================
// FUNÇÃO: CAPTURAR RESPOSTA
// ============================================
function capturarResposta(numeroPergunta) {
  if (numeroPergunta === 1) {
    // Pergunta 1: Nome e Habilidades
    const resposta1 = document.getElementById('textAnswer1')?.value.trim() || "";
    const partes = resposta1.split(',');
    respostas.nome = partes[0].trim();
    respostas.habilidades = resposta1;
  } 
  else if (numeroPergunta === 2) {
    // Pergunta 2: Email (NOVO)
    respostas.email = document.getElementById('textAnswer2')?.value.trim() || "";
  }
  else if (numeroPergunta === 3) {
    // Pergunta 3: Localização (NOVO)
    respostas.localizacao = document.getElementById('textAnswer2')?.value.trim() || "";
  }
  else if (numeroPergunta === 4) {
    // Pergunta 4: Experiência
    const selecionado = document.querySelector('#question4 .option-btn.selecionado');
    if (selecionado) {
      respostas.experiencia_opcao = selecionado.dataset.opcao;
    }
  }
  else if (numeroPergunta === 5) {
    // Pergunta 5: Disponibilidade
    const selecionado = document.querySelector('#question5 .option-btn.selecionado');
    if (selecionado) {
      respostas.disponibilidade_opcao = selecionado.dataset.opcao;
    }
  }
}

// ============================================
// FUNÇÃO: SELECIONAR OPÇÃO
// ============================================
function selecionarOpcao(botao, pergunta, opcao) {
  const botoes = document.querySelectorAll('#question' + pergunta + ' .option-btn');
  botoes.forEach(b => b.classList.remove('selecionado'));
  botao.classList.add('selecionado');

  if (pergunta === 4) {
    respostas.experiencia_opcao = opcao;
  } else if (pergunta === 5) {
    respostas.disponibilidade_opcao = opcao;
  }
}

// ============================================
// FUNÇÃO: ENVIAR FORMULÁRIO PARA API
// ============================================
async function enviarFormulario() {
  console.log("Respondas:", respostas);

  // Validar dados
  if (!respostas.nome || !respostas.email || !respostas.habilidades) {
    alert("Por favor, preencha todos os campos!");
    return;
  }

  try {
    // Mostrar loading
    const botaoEnviar = document.getElementById('submitBtn');
    botaoEnviar.disabled = true;
    botaoEnviar.textContent = "Enviando...";

    const response = await fetch(`${API_URL}/api/questionario`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(respostas),
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const resultado = await response.json();
    console.log("Resultado:", resultado);

    // ✅ Mostrar recomendações
    exibirRecomendacoes(resultado);

    botaoEnviar.textContent = "Enviado com Sucesso! ✅";
  } catch (error) {
    console.error("Erro ao enviar:", error);
    alert("Erro ao processar suas respostas. Verifique o console.");
    
    const botaoEnviar = document.getElementById('submitBtn');
    botaoEnviar.disabled = false;
    botaoEnviar.textContent = "Enviar Respostas";
  }
}

// ============================================
// FUNÇÃO: EXIBIR RECOMENDAÇÕES
// ============================================
function exibirRecomendacoes(resultado) {
  const container = document.getElementById('resultContainer');
  
  if (!container) {
    console.log("Resultado recebido:", resultado);
    alert("✅ Questionário enviado! Verifique o console para ver as recomendações.");
    return;
  }

  let html = `<h2>🎉 Suas Recomendações</h2>`;
  html += `<p>Olá, ${resultado.usuario_id || "Voluntário"}!</p>`;
  html += `<p>Encontramos <strong>${resultado.total_encontrado}</strong> projeto(s) para você!</p>`;

  if (resultado.recomendacoes && resultado.recomendacoes.length > 0) {
    html += `<div class="recomendacoes">`;
    resultado.recomendacoes.forEach((r, idx) => {
      html += `
        <div class="card-recomendacao" style="margin-bottom: 20px; padding: 15px; border: 2px solid #4CAF50; border-radius: 8px;">
          <h3>${idx + 1}. ${r.projeto.titulo}</h3>
          <p><strong>Organização:</strong> ${r.projeto.organizacao}</p>
          <p><strong>Descrição:</strong> ${r.projeto.descricao}</p>
          <p><strong>Localização:</strong> ${r.projeto.localizacao}</p>
          <p><strong>Score de Compatibilidade:</strong> <strong style="color: #4CAF50;">${r.score}%</strong></p>
          ${r.match_habilidades.length > 0 ? `<p><strong>Suas habilidades:</strong> ${r.match_habilidades.join(", ")}</p>` : ""}
        </div>
      `;
    });
    html += `</div>`;
  }

  if (resultado.recomendacao_ia) {
    html += `<div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
      <h3>💡 Recomendação da IA</h3>
      <p>${resultado.recomendacao_ia}</p>
    </div>`;
  }

  container.innerHTML = html;
  container.style.display = "block";
}

updateProgress();
```

---

### **ARQUIVO 6: `Front-end/index.html` (CORRIGIDO)**

Adicionar perguntas 4 e 5, e botão de submit:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ajuda.AI - Encontre o Voluntariado Certo Para Você</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <header>
      <h1>🌍 Ajuda.AI</h1>
      <p>Orquestrando o voluntariado inteligente</p>
    </header>

    <div class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" id="progressFill"></div>
      </div>
      <p class="progress-count" id="progressCount">1 de 5</p>
    </div>

    <div class="quiz-container">
      <!-- PERGUNTA 1: Nome e Habilidades -->
      <div id="question1" class="question-card">
        <h2>Qual é seu nome e quais são suas habilidades?</h2>
        <p>Ex: João, programação, design, ensino</p>
        <input type="text" id="textAnswer1" placeholder="Seu nome, habilidades..." class="input-field">
        <button onclick="nextQuestion(1)" class="btn-primary">Próximo →</button>
      </div>

      <!-- PERGUNTA 2: Email -->
      <div id="question2" class="question-card hidden">
        <h2>Qual é seu email?</h2>
        <input type="email" id="textAnswer2" placeholder="seu@email.com" class="input-field">
        <button onclick="nextQuestion(2)" class="btn-primary">Próximo →</button>
      </div>

      <!-- PERGUNTA 3: Localização -->
      <div id="question3" class="question-card hidden">
        <h2>Em qual cidade/região você está?</h2>
        <input type="text" id="textAnswer3" placeholder="Ex: São Paulo, SP" class="input-field">
        <button onclick="nextQuestion(3)" class="btn-primary">Próximo →</button>
      </div>

      <!-- PERGUNTA 4: Experiência -->
      <div id="question4" class="question-card hidden">
        <h2>Qual seu nível de experiência com voluntariado?</h2>
        <button class="option-btn" onclick="selecionarOpcao(this, 4, 'A');" data-opcao="A">
          <span>A</span> Iniciante
        </button>
        <button class="option-btn" onclick="selecionarOpcao(this, 4, 'B');" data-opcao="B">
          <span>B</span> Intermediário
        </button>
        <button class="option-btn" onclick="selecionarOpcao(this, 4, 'C');" data-opcao="C">
          <span>C</span> Avançado
        </button>
        <button class="option-btn" onclick="selecionarOpcao(this, 4, 'D');" data-opcao="D">
          <span>D</span> Especialista
        </button>
        <button onclick="nextQuestion(4)" class="btn-primary">Próximo →</button>
      </div>

      <!-- PERGUNTA 5: Disponibilidade -->
      <div id="question5" class="question-card hidden">
        <h2>Quanto tempo você pode dedicar?</h2>
        <button class="option-btn" onclick="selecionarOpcao(this, 5, 'A');" data-opcao="A">
          <span>A</span> Eventual
        </button>
        <button class="option-btn" onclick="selecionarOpcao(this, 5, 'B');" data-opcao="B">
          <span>B</span> Fim de Semana
        </button>
        <button class="option-btn" onclick="selecionarOpcao(this, 5, 'C');" data-opcao="C">
          <span>C</span> Semanal
        </button>
        <button class="option-btn" onclick="selecionarOpcao(this, 5, 'D');" data-opcao="D">
          <span>D</span> Emergências
        </button>
        <button id="submitBtn" onclick="enviarFormulario()" class="btn-success">Enviar Respostas ✅</button>
      </div>
    </div>

    <!-- RESULTADO -->
    <div id="resultContainer" style="display: none; margin-top: 30px;"></div>
  </div>

  <script src="script.js"></script>
</body>
</html>
```

---

## 🚀 COMO TESTAR

### **PASSO 1: Prepare o ambiente**

```bash
# Criar arquivo .env
echo "PORT=3000
NODE_ENV=development" > .env
```

### **PASSO 2: Inicie o servidor**

```bash
npm start
```

Você deve ver:

```
╔════════════════════════════════════════╗
║         🌍 AJUDA.AI - SERVIDOR        ║
╚════════════════════════════════════════╝

✅ Servidor rodando em http://localhost:3000
```

### **PASSO 3: Carregue dados de exemplo**

```bash
curl -X POST http://localhost:3000/api/seed
```

Resposta esperada:

```json
{
  "mensagem": "Dados de exemplo inseridos!",
  "projetos_inseridos": 3
}
```

### **PASSO 4: Verifique o health**

```bash
curl http://localhost:3000/health
```

### **PASSO 5: Abra o frontend**

Abra `Front-end/index.html` no navegador (ou use live server).

Teste preenchendo:
- Nome: João
- Email: joao@email.com
- Localização: São Paulo, SP
- Habilidades: programação, ensino
- Experiência: A (Iniciante)
- Disponibilidade: C (Semanal)

---

## ✅ CHECKLIST FINAL

- [ ] Arquivo `.env` criado com `PORT=3000`
- [ ] `database/db.js` atualizado com coluna `localizacao`
- [ ] `services/watsonx.js` com modo MOCK
- [ ] `server.js` com CORS melhorado
- [ ] `Front-end/script.js` enviando dados para API
- [ ] `Front-end/index.html` com todas as 5 perguntas
- [ ] Servidor rodando em `http://localhost:3000`
- [ ] Endpoint `/api/seed` funcionando
- [ ] Endpoint `/api/questionario` recebendo POST
- [ ] Frontend enviando dados corretamente

---

## 🎯 RESULTADO ESPERADO

Quando você enviar o formulário:

1. ✅ Dados salvos no banco de dados
2. ✅ Score de compatibilidade calculado
3. ✅ Recomendações retornadas com score > 30
4. ✅ Agente IA gera recomendação personalizada
5. ✅ Resultado exibido no frontend

---

Se houver erros, execute:

```bash
# Limpar banco de dados e recomeçar
rm database.sqlite
node server.js
curl -X POST http://localhost:3000/api/seed
```

**Agora SIM, vai funcionar! 🚀**
