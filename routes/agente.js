const express = require("express");
const router = express.Router();
const WatsonxClient = require("../services/watsonx");

const perguntas_onboarding = [
  {
    id: "nome",
    pergunta: "Qual é o seu nome completo?",
    categoria: "dados_pessoais",
  },
  {
    id: "localizacao",
    pergunta: "Em qual cidade/região você está disponível para ajudar?",
    categoria: "localizacao",
  },
  {
    id: "habilidades",
    pergunta:
      "Quais são suas principais habilidades? (ex: programação, design, cozinha, construção, ensino, saúde)",
    categoria: "habilidades",
  },
  {
    id: "disponibilidade",
    pergunta:
      "Quanto tempo você pode dedicar? (semanal, fim de semana, eventual, emergências)",
    categoria: "disponibilidade",
  },
  {
    id: "areas_interesse",
    pergunta:
      "Quais causas te movem? (educação, meio ambiente, saúde, assistência social, catástrofes)",
    categoria: "interesses",
  },
  {
    id: "experiencia",
    pergunta:
      "Qual seu nível de experiência com voluntariado? (iniciante, intermediário, avançado)",
    categoria: "experiencia",
  },
];

router.post("/conversar", async (req, res) => {
  try {
    const { mensagem, historico = [], etapa } = req.body;

    //dar o contexto pro agente coitado
    const contexto = {
      etapa_onboarding: etapa,
      perguntas_disponiveis: perguntas_onboarding,
    };

    const mensagens = [
      {
        role: "system",
        content: `Você é um assistente de matching social. Seu objetivo é ajudar pessoas a encontrarem projetos de voluntariado ou comunidades que precisam de ajuda. 
        Faça perguntas de forma empática e natural. Extraia informações sobre: habilidades, localização, disponibilidade de tempo, áreas de interesse e experiência.
        Quando tiver informações suficientes, sugira que o usuário veja as recomendações.`,
      },
      ...historico,
      { role: "user", content: mensagem },
    ];

    const resposta = await WatsonxClient.chatWithAgent(mensagens, contexto);
    res.json({
      resposta: resposta.choices[0].message.content,
      thread_id: resposta.thread_id,
      etapa: etapa,
    });
  } catch (error) {
console.error("Erro no agente", error.response?.data || error.message);
    res.status(500).json({ error: "Erro ao comunicar com o agente" });
  }
});

//pegar a proxima pergunta do onboarding
router.get("/onboarding/:etapa", (req, res) => {
  const etapa = parseInt(req.params.etapa);
  const pergunta = perguntas_onboarding[etapa];

  if (!pergunta)
    return res.json({ finalizado: true, mensagem: "Onboarding finalizado!" });

  res.json(pergunta);
});

module.exports = router;
