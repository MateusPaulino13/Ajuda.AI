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

    const respostaAleatoria =
      respostas[Math.floor(Math.random() * respostas.length)];

    return {
      choices: [
        {
          message: {
            content: respostaAleatoria,
          },
        },
      ],
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
