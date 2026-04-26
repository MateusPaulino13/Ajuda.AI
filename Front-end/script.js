// ============================================
//! VARIÁVEIS GLOBAIS
//! ============================================
let currentQuestion = 1;
const totalQuestions = 4;

// Objeto que armazena as respostas do usuário para envio ao backend
const respostas = {
  habilidades: "",
  experiencia_opcao: "",
  disponibilidade_opcao: "",
  areas_interesse: "",
  nome: "",
  email: "",
  localizacao: ""
};

// ============================================
//! FUNÇÃO: ATUALIZAR BARRA DE PROGRESSO
//! ============================================
function updateProgress() {
  const progressFill = document.getElementById('progressFill');
  const progressCount = document.getElementById('progressCount');
  const percentage = (currentQuestion / totalQuestions) * 100;

  progressFill.style.width = percentage + '%';
  progressCount.textContent = currentQuestion + ' de ' + totalQuestions;
}

// ============================================
//! FUNÇÃO: NAVEGAR PARA PRÓXIMA PERGUNTA
//! ============================================
function nextQuestion(fromQuestion) {
  const currentCard = document.getElementById('question' + fromQuestion);
  const nextCard = document.getElementById('question' + (fromQuestion + 1));

  // Captura respostas antes de avançar
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
//! FUNÇÃO: CAPTURAR RESPOSTA DA PERGUNTA ATUAL
//! ============================================
function capturarResposta(numeroPergunta) {
  if (numeroPergunta === 1) {
    const val = document.getElementById('textAnswer1').value.trim();
    respostas.habilidades = val;
    respostas.nome = val.split(/[,\s]/)[0] || "Usuário";
  } else if (numeroPergunta === 2) {
    const selecionado = document.querySelector('#question2 .option-btn.selecionado');
    if (selecionado) {
      respostas.experiencia_opcao = selecionado.dataset.opcao;
    }
  } else if (numeroPergunta === 3) {
    const selecionado = document.querySelector('#question3 .option-btn.selecionado');
    if (selecionado) {
      respostas.disponibilidade_opcao = selecionado.dataset.opcao;
    }
  } else if (numeroPergunta === 4) {
    respostas.areas_interesse = document.getElementById('textAnswer').value.trim();
  }
}

// ============================================
//! FUNÇÃO: SELECIONAR OPÇÃO (PERGUNTAS 2 E 3)
//! ============================================
function selecionarOpcao(botao, pergunta, opcao) {
  const botoes = document.querySelectorAll('#question' + pergunta + ' .option-btn');
  botoes.forEach(b => b.classList.remove('selecionado'));
  botao.classList.add('selecionado');

  if (pergunta === 2) {
    respostas.experiencia_opcao = opcao;
  } else if (pergunta === 3) {
    respostas.disponibilidade_opcao = opcao;
  }

  // Avança automaticamente após selecionar
  nextQuestion(pergunta);
}

// ============================================
//! FUNÇÃO: VALIDAR CAMPO DE TEXTO (PERGUNTA 1)
//! ============================================
function checkTextInput1() {
  const textAnswer1 = document.getElementById('textAnswer1');
  const submitBtn1 = document.getElementById('submitBtn1');

  if (textAnswer1.value.trim().length > 0) {
    submitBtn1.disabled = false;
  } else {
    submitBtn1.disabled = true;
  }
}

// ============================================
//! FUNÇÃO: VALIDAR CAMPO DE TEXTO (PERGUNTA 4)
//! ============================================
function checkTextInput() {
  const textAnswer = document.getElementById('textAnswer');
  const submitBtn = document.getElementById('submitBtn');

  if (textAnswer.value.trim().length > 0) {
    submitBtn.disabled = false;
  } else {
    submitBtn.disabled = true;
  }
}

// ============================================
//! FUNÇÃO: FINALIZAR QUESTIONÁRIO
//! ============================================
async function finishQuiz() {
  // Captura última resposta
  respostas.areas_interesse = document.getElementById('textAnswer').value.trim();

  const question4 = document.getElementById('question4');
  const completionScreen = document.getElementById('completionScreen');

  question4.classList.add('slide-out');

  setTimeout(async function() {
    question4.classList.add('hidden');
    question4.classList.remove('slide-out');

    completionScreen.classList.remove('hidden');
    completionScreen.classList.add('slide-in');

    const progressFill = document.getElementById('progressFill');
    const progressCount = document.getElementById('progressCount');
    progressFill.style.width = '100%';
    progressCount.textContent = 'Completo!';

    setTimeout(function() {
      completionScreen.classList.remove('slide-in');
    }, 400);

    // Envia dados ao backend e aguarda recomendação da IA
    await enviarQuestionario();
  }, 400);
}

// ============================================
//! FUNÇÃO: ENVIAR QUESTIONÁRIO AO BACKEND
//! ============================================
async function enviarQuestionario() {
  try {
    const respostaContainer = document.getElementById('recomendacaoIA');
    if (respostaContainer) {
      respostaContainer.innerHTML = '<p class="loading-text">Gerando recomendação personalizada...</p>';
    }

    const response = await fetch('http://localhost:3000/api/questionario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(respostas)
    });

    if (!response.ok) {
      throw new Error('Erro ao enviar questionário: ' + response.status);
    }

    const data = await response.json();

    // Exibe recomendação da IA na tela de conclusão
    exibirRecomendacao(data);
  } catch (error) {
    console.error('Erro ao enviar questionário:', error);
    const respostaContainer = document.getElementById('recomendacaoIA');
    if (respostaContainer) {
      respostaContainer.innerHTML = '<p class="error-text">Não foi possível gerar a recomendação no momento. Tente novamente mais tarde.</p>';
    }
  }
}

// ============================================
//! FUNÇÃO: EXIBIR RECOMENDAÇÃO DA IA
//! ============================================
function exibirRecomendacao(data) {
  const container = document.getElementById('recomendacaoIA');
  if (!container) return;

  let html = '';

  if (data.recomendacao_ia) {
    html += '<div class="ia-recomendacao">';
    html += '<h3>Recomendação Personalizada</h3>';
    html += '<p>' + escapeHtml(data.recomendacao_ia) + '</p>';
    html += '</div>';
  }

  if (data.recomendacoes && data.recomendacoes.length > 0) {
    html += '<div class="projetos-recomendados">';
    html += '<h3>Projetos Recomendados</h3>';
    html += '<ul>';
    data.recomendacoes.forEach(function(rec) {
      html += '<li>';
      html += '<strong>' + escapeHtml(rec.projeto.titulo) + '</strong>';
      html += ' — Score: ' + rec.score + '%';
      if (rec.match_habilidades && rec.match_habilidades.length > 0) {
        html += ' <span class="match-tags">(' + rec.match_habilidades.map(escapeHtml).join(', ') + ')</span>';
      }
      html += '</li>';
    });
    html += '</ul>';
    html += '</div>';
  } else {
    html += '<p class="no-results">Nenhum projeto compatível encontrado no momento.</p>';
  }

  container.innerHTML = html;
}

// ============================================
//! FUNÇÃO: ESCAPAR HTML (SEGURANÇA)
//! ============================================
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

