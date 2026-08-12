// ============================================================
// openaiService.js — OpenAI GPT-4 Integration
// ============================================================
 
const OpenAI = require('openai');
 
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
 
// ── Normal chat (non-streaming) ───────────────────────────
const chat = async (messages, systemPrompt) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });
    return response.choices[0].message.content;
  } catch (err) {
    console.error('OpenAI chat error:', err.message);
    throw err;
  }
};
 
// ── Streaming chat ────────────────────────────────────────
// Streams tokens to res AND calls onComplete(fullAnswer) when done
// onComplete is used by chat.js to save the answer to database
const chatStream = async (messages, systemPrompt, res, onComplete) => {
  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.1,
      max_tokens: 1000,
      stream: true,
    });
 
    let fullAnswer = '';
 
    // Stream each token to the frontend
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) {
        fullAnswer += token;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }
 
    // After streaming completes call onComplete so chat.js can save to DB
    if (onComplete) {
      await onComplete(fullAnswer);
    } else {
      // Fallback if no callback provided
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
 
  } catch (err) {
    console.error('OpenAI stream error:', err.message);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
};
 
// ── Embed text ────────────────────────────────────────────
const embed = async (text) => {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  } catch (err) {
    console.error('OpenAI embed error:', err.message);
    throw err;
  }
};
 
module.exports = { chat, chatStream, embed };