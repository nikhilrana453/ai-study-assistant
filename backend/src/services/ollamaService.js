const axios = require('axios');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// ─── Chat completion — strict, grounded settings ──────────────────────────────
const chat = async (messages, systemPrompt) => {
  const response = await axios.post(`${OLLAMA_URL}/api/chat`, {
    model: 'llama3.2',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    stream: false,
    options: {
      temperature: 0.05,     // ← near-zero = maximum factual strictness, minimal creativity
      top_p: 0.4,            // ← very narrow token selection — stays on topic
      top_k: 20,             // ← only consider top 20 tokens at each step (NEW — reduces drift)
      repeat_penalty: 1.3,   // ← stops repeating itself
      num_predict: 800,      // ← cap response length to prevent rambling (NEW)
    }
  });
  return response.data.message.content;
};

// ─── Embedding — unchanged ────────────────────────────────────────────────────
const embed = async (text) => {
  const response = await axios.post(`${OLLAMA_URL}/api/embeddings`, {
    model: 'nomic-embed-text',
    prompt: text
  });
  return response.data.embedding;
};

module.exports = { chat, embed };