const axios = require("axios");

class WatsonxClient {
  constructor() {
    this.baseURL =
      process.env.WATSONX_URL ||
      "https://api.us-south.watson-orchestrate.ibm.com";

    this.apiKey = process.env.WATSONX_API_KEY;
    this.agentId = process.env.WATSONX_AGENT_ID;
  }

  async getBearerToken() {
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

  async chatWithAgent(mensagens, contexto = {}) {
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
  }

  async chatLocal(mensagens) {
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
