// ============================================
//! VARIÁVEIS GLOBAIS
//! ============================================
let currentQuestion = 1; // Controla qual pergunta está ativa (1-4)
const totalQuestions = 4; // Número total de perguntas no questionário

// ============================================
//! FUNÇÃO: ATUALIZAR BARRA DE PROGRESSO
//! ============================================
// Atualiza visualmente a barra de progresso e o contador
function updateProgress() {
  const progressFill = document.getElementById('progressFill'); // Elemento da barra
  const progressCount = document.getElementById('progressCount'); // Texto do contador
  const percentage = (currentQuestion / totalQuestions) * 100; // Calcula percentual
  
  progressFill.style.width = percentage + '%'; // Atualiza largura da barra
  progressCount.textContent = currentQuestion + ' de ' + totalQuestions; // Atualiza texto
}

// ============================================
//! FUNÇÃO: NAVEGAR PARA PRÓXIMA PERGUNTA
//! ============================================
// Controla a transição entre perguntas com animações
// @param {number} fromQuestion - Número da pergunta atual
function nextQuestion(fromQuestion) {
  const currentCard = document.getElementById('question' + fromQuestion); // Card atual
  const nextCard = document.getElementById('question' + (fromQuestion + 1)); // Próximo card

  // * Animação de saída do card atual
  currentCard.classList.add('slide-out');

  // * Aguarda animação de saída completar
  setTimeout(function() {
    currentCard.classList.add('hidden'); // Esconde card atual
    currentCard.classList.remove('slide-out'); // Remove classe de animação
    
    // * Mostra próximo card com animação de entrada
    nextCard.classList.remove('hidden'); // Torna visível
    nextCard.classList.add('slide-in'); // Adiciona animação de entrada

    currentQuestion = fromQuestion + 1; // Atualiza contador global
    updateProgress(); // Atualiza barra de progresso

    // * Remove classe de animação após completar
    setTimeout(function() {
      nextCard.classList.remove('slide-in');
    }, 400);
  }, 400); // Tempo igual à duração da animação
}

// ============================================
//! FUNÇÃO: VALIDAR CAMPO DE TEXTO (PERGUNTA 4)
//! ============================================
// Habilita/desabilita botão de envio baseado no conteúdo do textarea
function checkTextInput() {
  const textAnswer = document.getElementById('textAnswer'); // Campo de texto
  const submitBtn = document.getElementById('submitBtn'); // Botão de enviar
  
  // * Verifica se há texto (ignorando espaços em branco)
  if (textAnswer.value.trim().length > 0) {
    submitBtn.disabled = false; // Habilita botão
  } else {
    submitBtn.disabled = true; // Mantém desabilitado
  }
}

// ============================================
//! FUNÇÃO: VALIDAR CAMPO DE TEXTO (PERGUNTA 1)
//! ============================================
// Habilita/desabilita botão de envio baseado no conteúdo do textarea da Pergunta 1
function checkTextInput1() {
  const textAnswer1 = document.getElementById('textAnswer1'); // Campo de texto da Pergunta 1
  const submitBtn1 = document.getElementById('submitBtn1'); // Botão de enviar da Pergunta 1
  
  // * Verifica se há texto (ignorando espaços em branco)
  if (textAnswer1.value.trim().length > 0) {
    submitBtn1.disabled = false; // Habilita botão
  } else {
    submitBtn1.disabled = true; // Mantém desabilitado
  }
}

// ============================================
//! FUNÇÃO: FINALIZAR QUESTIONÁRIO
//! ============================================
// Exibe tela de conclusão e atualiza progresso para 100%
function finishQuiz() {
  const question4 = document.getElementById('question4'); // Última pergunta
  const completionScreen = document.getElementById('completionScreen'); // Tela de sucesso

  // * Animação de saída da última pergunta
  question4.classList.add('slide-out');

  // * Aguarda animação completar
  setTimeout(function() {
    question4.classList.add('hidden'); // Esconde última pergunta
    question4.classList.remove('slide-out'); // Remove classe de animação
    
    // * Mostra tela de conclusão com animação
    completionScreen.classList.remove('hidden'); // Torna visível
    completionScreen.classList.add('slide-in'); // Adiciona animação

    // * Atualiza barra de progresso para 100%
    const progressFill = document.getElementById('progressFill');
    const progressCount = document.getElementById('progressCount');
    progressFill.style.width = '100%'; // Barra completa
    progressCount.textContent = 'Completo!'; // Texto de conclusão

    // * Remove classe de animação após completar
    setTimeout(function() {
      completionScreen.classList.remove('slide-in');
    }, 400);
  }, 400); // Tempo igual à duração da animação
}