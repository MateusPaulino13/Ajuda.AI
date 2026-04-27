// ============================================
//! VARIÁVEIS GLOBAIS
//! ============================================
let currentQuestion = 1;
const totalQuestions = 5; // ✅ Aumentado para 5
const API_URL = "http://localhost:3000"; // ✅ URL da API

const respostas = {
  nome: "",
  email: "", // ✅ ADICIONADO
  localizacao: "", // ✅ ADICIONADO
  habilidades: "",
  experiencia_opcao: "",
  disponibilidade_opcao: "",
  areas_interesse: "",
};

// ============================================
//! FUNÇÃO: ATUALIZAR BARRA DE PROGRESSO
// ============================================
function updateProgress() {
  const progressFill = document.getElementById("progressFill");
  const progressCount = document.getElementById("progressCount");
  const percentage = (currentQuestion / totalQuestions) * 100;

  progressFill.style.width = percentage + "%";
  progressCount.textContent = currentQuestion + " de " + totalQuestions;
}

// ============================================
//! FUNÇÃO: NAVEGAR PARA PRÓXIMA PERGUNTA
// ============================================
function nextQuestion(fromQuestion) {
  const currentCard = document.getElementById("question" + fromQuestion);
  const nextCard = document.getElementById("question" + (fromQuestion + 1));

  // Validar resposta antes de avançar
  if (!validarResposta(fromQuestion)) {
    alert("Por favor, responda a pergunta!");
    return;
  }

  capturarResposta(fromQuestion);

  currentCard.classList.add("slide-out");

  setTimeout(function () {
    currentCard.classList.add("hidden");
    currentCard.classList.remove("slide-out");

    nextCard.classList.remove("hidden");
    nextCard.classList.add("slide-in");

    currentQuestion = fromQuestion + 1;
    updateProgress();

    setTimeout(function () {
      nextCard.classList.remove("slide-in");
    }, 400);
  }, 400);
}

// ============================================
//! FUNÇÃO: VALIDAR RESPOSTA
// ============================================
function validarResposta(numeroPergunta) {
  if (numeroPergunta === 1) {
    return document.getElementById("textAnswer1")?.value.trim().length > 0;
  } else if (numeroPergunta === 2) {
    return (
      document.querySelector("#question2 .option-btn.selecionado") !== null
    );
  } else if (numeroPergunta === 3) {
    return document.getElementById("textAnswer2")?.value.trim().length > 0;
  } else if (numeroPergunta === 4) {
    return (
      document.querySelector("#question4 .option-btn.selecionado") !== null
    );
  } else if (numeroPergunta === 5) {
    return document.getElementById("textAnswer3")?.value.trim().length > 0;
  }
  return false;
}

// ============================================
//! FUNÇÃO: CAPTURAR RESPOSTA
// ============================================
function capturarResposta(numeroPergunta) {
  if (numeroPergunta === 1) {
    // Pergunta 1: Nome e Habilidades
    const resposta1 =
      document.getElementById("textAnswer1")?.value.trim() || "";
    const partes = resposta1.split(",");
    respostas.nome = partes[0].trim();
    respostas.habilidades = resposta1;
  } else if (numeroPergunta === 2) {
    // Pergunta 2: Email (NOVO)
    respostas.email =
      document.getElementById("textAnswer2")?.value.trim() || "";
  } else if (numeroPergunta === 3) {
    // Pergunta 3: Localização (NOVO)
    respostas.localizacao =
      document.getElementById("textAnswer2")?.value.trim() || "";
  } else if (numeroPergunta === 4) {
    // Pergunta 4: Experiência
    const selecionado = document.querySelector(
      "#question4 .option-btn.selecionado",
    );
    if (selecionado) {
      respostas.experiencia_opcao = selecionado.dataset.opcao;
    }
  } else if (numeroPergunta === 5) {
    // Pergunta 5: Disponibilidade
    const selecionado = document.querySelector(
      "#question5 .option-btn.selecionado",
    );
    if (selecionado) {
      respostas.disponibilidade_opcao = selecionado.dataset.opcao;
    }
  }
}

// ============================================
//! FUNÇÃO: SELECIONAR OPÇÃO
// ============================================
function selecionarOpcao(botao, pergunta, opcao) {
  const botoes = document.querySelectorAll(
    "#question" + pergunta + " .option-btn",
  );
  botoes.forEach((b) => b.classList.remove("selecionado"));
  botao.classList.add("selecionado");

  if (pergunta === 4) {
    respostas.experiencia_opcao = opcao;
  } else if (pergunta === 5) {
    respostas.disponibilidade_opcao = opcao;
  }
}

// ============================================
//! FUNÇÃO: ENVIAR FORMULÁRIO PARA API
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
    const botaoEnviar = document.getElementById("submitBtn");
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

    const botaoEnviar = document.getElementById("submitBtn");
    botaoEnviar.disabled = false;
    botaoEnviar.textContent = "Enviar Respostas";
  }
}

// ============================================
//! FUNÇÃO: EXIBIR RECOMENDAÇÕES
// ============================================
function exibirRecomendacoes(resultado) {
  const container = document.getElementById("resultContainer");

  if (!container) {
    console.log("Resultado recebido:", resultado);
    alert(
      "✅ Questionário enviado! Verifique o console para ver as recomendações.",
    );
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
