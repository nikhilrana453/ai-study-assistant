const axios = require('axios');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

const chat = async (messages, systemPrompt) => {
  const response = await axios.post(`${OLLAMA_URL}/api/chat`, {
    model: 'llama3.2',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    stream: false,
    options: {
      temperature: 0.1,      // ← very low = strict and focused
      top_p: 0.5,            // ← limits random word choices
      repeat_penalty: 1.3    // ← stops repeating itself
    }
  });
  return response.data.message.content;
};

const embed = async (text) => {
  const response = await axios.post(`${OLLAMA_URL}/api/embeddings`, {
    model: 'nomic-embed-text',
    prompt: text
  });
  return response.data.embedding;
};

module.exports = { chat, embed };