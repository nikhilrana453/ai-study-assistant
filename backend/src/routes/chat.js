// ============================================================
// chat.js — Chat Routes for AI Study Assistant
// ============================================================
// Changes:
//  - Removed query expansion (ragService embeds the question as asked).
//  - Context widened: 3 chunks @ 800 chars  →  5 chunks @ 1200 chars.
//  - System prompt now permits reasoning ACROSS the retrieved material
//    (comparison, application to a scenario) instead of verbatim recall
//    only. "Beyond the scope" is reserved for genuinely unrelated topics.
// ============================================================

const express = require('express');
const router  = express.Router();
const prisma  = require('../prismaClient');

const { authenticateToken } = require('../middleware/auth');
const { checkEnrollment }   = require('../middleware/checkEnrollment');
const { chat, chatStream }  = require('../services/openaiService');
const { searchMaterials }   = require('../services/ragService');

// How much retrieved material to put in front of the model
const MAX_CONTEXT_CHUNKS = 5;
const MAX_CHARS_PER_CHUNK = 1200;

// ============================================================
// GUARDRAIL 1 — Input Safety
// ============================================================
const checkInputSafety = (question) => {
  const injectionPatterns = [
    /ignore (previous|above|all) instructions/i,
    /forget (previous|above|all) instructions/i,
    /you are now/i,
    /act as/i,
    /pretend (you are|to be)/i,
    /jailbreak/i,
    /bypass/i,
    /override (system|instructions)/i,
    /reveal (your|the) (prompt|instructions|system)/i,
    /what are your instructions/i,
    /show me your (prompt|system|rules)/i,
  ];
  for (const pattern of injectionPatterns) {
    if (pattern.test(question)) {
      return { safe: false, reason: 'This type of request is beyond the scope of this course. Please ask a question related to your course content.' };
    }
  }
  const inappropriatePatterns = [
    /\b(hack|exploit|weapon|bomb|kill|violence)\b/i,
    /\b(porn|sex|nude|explicit)\b/i,
  ];
  for (const pattern of inappropriatePatterns) {
    if (pattern.test(question)) {
      return { safe: false, reason: 'This topic is beyond the scope of this course. Please ask academic questions related to your course.' };
    }
  }
  if (question.trim().length < 3) return { safe: false, reason: 'Please ask a complete question about your course content.' };
  if (question.length > 1000)    return { safe: false, reason: 'Your question is too long. Please keep it under 1000 characters.' };
  return { safe: true };
};

// ============================================================
// GUARDRAIL 2 — Scope Check
// ============================================================
const checkScope = (question) => {
  const offTopicPatterns = [
    /what is the weather/i,
    /tell me a joke/i,
    /write me a (poem|song|story)/i,
    /who is the president/i,
    /what is the stock price/i,
    /can you (cook|make) (food|recipe)/i,
    /translate (this|to)/i,
  ];
  for (const pattern of offTopicPatterns) {
    if (pattern.test(question)) {
      return { inScope: false, reason: 'This topic is beyond the scope of this course. Please refer to your lecturer for further guidance.' };
    }
  }
  return { inScope: true };
};

// ============================================================
// GUARDRAIL 3 — Output Safety
// ============================================================
const checkOutputSafety = (answer) => {
  const leakPatterns = [
    /RULE \d+/i,
    /system prompt/i,
    /as an AI language model/i,
    /I am ChatGPT/i,
    /I am GPT/i,
    /according to rule/i,
    /my instructions say/i,
  ];
  for (const pattern of leakPatterns) {
    if (pattern.test(answer)) {
      return { safe: false, cleanAnswer: 'This topic is beyond the scope of this course. Please refer to your lecturer for further guidance.' };
    }
  }
  return { safe: true, cleanAnswer: answer };
};

// ============================================================
// HELPER — Build retrieval context
// ============================================================
const buildContext = (relevantChunks) => {
  if (!relevantChunks || relevantChunks.length === 0) {
    return { context: '', sources: [] };
  }

  const topChunks = relevantChunks.slice(0, MAX_CONTEXT_CHUNKS);

  const context = topChunks
    .map((chunk, i) =>
      `[Source ${i + 1}: ${chunk.metadata.materialTitle}]\n${chunk.text.substring(0, MAX_CHARS_PER_CHUNK)}`
    )
    .join('\n\n');

  const sources = [...new Set(topChunks.map(c => c.metadata.materialTitle))];

  return { context, sources };
};

// ============================================================
// HELPER — Build system prompt
// ============================================================
const buildSystemPrompt = (courseName, context, hintMode) => {
  const hasContext = context && context.trim().length > 0;

  if (!hasContext) {
    return `You are a study tutor for the course "${courseName}".
No course materials were found for this question.
Reply only with:
"This topic is beyond the scope of this course. Please refer to your lecturer for further guidance."`;
  }

  const shared = `You are a study tutor for the course "${courseName}".

The COURSE MATERIALS below are your source of truth. Ground your answer in them.

You are expected to reason with that material, not just quote it. You may:
- Compare or contrast two ideas that both appear in the materials, even when the materials never state the comparison directly.
- Apply concepts from the materials to a situation the student describes.
- Explain a term the materials use but do not define, keeping your explanation consistent with how the materials use it.
- Draw out an implication that follows from the materials.

Where you extend past what the materials state outright, mark it in one short phrase, for example: "the materials do not cover this case directly, but applying the control categories above...".

Reply with "This topic is beyond the scope of this course. Please refer to your lecturer for further guidance." ONLY when the question concerns a subject the materials do not touch at all. Never use that line for a question you can answer by reasoning over the materials below.

Formatting:
- Plain sentences. No markdown symbols such as ** or * or #.
- Use a dash - for bullet points.
- Never repeat a sentence or a bullet point.
- Do not ask follow-up questions and do not add closing offers such as "Would you like to know more".`;

  if (hintMode) {
    return `${shared}

MODE: Hint only. Point the student toward the relevant idea and the reasoning step they need to take next. Do not state the final answer.

COURSE MATERIALS:
${context}`;
  }

  return `${shared}

COURSE MATERIALS:
${context}`;
};

// ============================================================
// TEST — GET /api/chat/test
// ============================================================
router.get('/test', async (req, res) => {
  try {
    const answer = await chat(
      [{ role: 'user', content: 'Say hello in one sentence' }],
      'You are a helpful assistant'
    );
    res.json({ status: 'OpenAI is working', answer });
  } catch (err) {
    res.status(500).json({ error: 'OpenAI not working', details: err.message });
  }
});

// ============================================================
// COURSE ID HELPER
// ============================================================
router.get('/course-id-helper', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({ select: { id: true, name: true } });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// CHECK CHUNKS
// ============================================================
router.get('/check-chunks', async (req, res) => {
  try {
    const results = await searchMaterials('lecture notes content', req.query.courseId);
    res.json({
      chunksFound: results.length,
      content: results.map(r => ({
        text:     r.text.substring(0, 200),
        source:   r.metadata.materialTitle,
        distance: r.distance
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// MAIN CHAT — POST /api/chat/message (non-streaming)
// ============================================================
router.post('/message', authenticateToken, checkEnrollment, async (req, res) => {
  const { question, courseId, hintMode, sessionId: existingSessionId } = req.body;

  if (!question || !courseId) return res.status(400).json({ error: 'question and courseId are required' });

  const safetyCheck = checkInputSafety(question);
  if (!safetyCheck.safe) return res.json({ answer: safetyCheck.reason, sources: [], guardrail: 'input_safety' });

  const scopeCheck = checkScope(question);
  if (!scopeCheck.inScope) return res.json({ answer: scopeCheck.reason, sources: [], guardrail: 'scope' });

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return res.status(404).json({ error: 'Course not found' });

  // Search with the question exactly as the student asked it.
  const relevantChunks = await searchMaterials(question, courseId);
  const { context, sources } = buildContext(relevantChunks);

  const systemPrompt = buildSystemPrompt(course.name, context, hintMode);

  let session = null;
  if (existingSessionId) {
    session = await prisma.chatSession.findUnique({ where: { id: existingSessionId } });
  }
  if (!session) {
    session = await prisma.chatSession.create({ data: { userId: req.user.id, courseId } });
  }

  await prisma.message.create({ data: { sessionId: session.id, role: 'user', content: question } });

  const recentMessages = await prisma.message.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: 'desc' },
    take: 6
  });
  const messages = recentMessages.reverse().map(m => ({ role: m.role, content: m.content }));

  const rawAnswer   = await chat(messages, systemPrompt);
  const outputCheck = checkOutputSafety(rawAnswer);
  const finalAnswer = outputCheck.cleanAnswer;

  const savedMessage = await prisma.message.create({
    data: {
      sessionId: session.id,
      role:      'assistant',
      content:   finalAnswer,
      sources:   sources.length > 0 ? sources : null
    }
  });

  res.json({ answer: finalAnswer, sources, messageId: savedMessage.id, sessionId: session.id });
});

// ============================================================
// STREAMING CHAT — POST /api/chat/message/stream
// ============================================================
router.post('/message/stream', authenticateToken, checkEnrollment, async (req, res) => {
  const { question, courseId, hintMode, sessionId: existingSessionId } = req.body;

  if (!question || !courseId) return res.status(400).json({ error: 'question and courseId required' });

  // SSE headers
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  // Guardrail 1
  const safetyCheck = checkInputSafety(question);
  if (!safetyCheck.safe) {
    res.write(`data: ${JSON.stringify({ token: safetyCheck.reason, sources: [], done: true })}\n\n`);
    res.end();
    return;
  }

  // Guardrail 2
  const scopeCheck = checkScope(question);
  if (!scopeCheck.inScope) {
    res.write(`data: ${JSON.stringify({ token: scopeCheck.reason, sources: [], done: true })}\n\n`);
    res.end();
    return;
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    res.write(`data: ${JSON.stringify({ error: 'Course not found' })}\n\n`);
    res.end();
    return;
  }

  // Search with the question exactly as the student asked it.
  const relevantChunks = await searchMaterials(question, courseId);
  const { context, sources } = buildContext(relevantChunks);

  const systemPrompt = buildSystemPrompt(course.name, context, hintMode);

  // ── Session logic ─────────────────────────────────────────
  // existingSessionId = null  → New Chat clicked → create fresh session
  // existingSessionId = value → Continue session → use that session
  let session = null;

  if (existingSessionId) {
    session = await prisma.chatSession.findUnique({
      where: { id: existingSessionId }
    });
  }

  if (!session) {
    session = await prisma.chatSession.create({
      data: { userId: req.user.id, courseId }
    });
  }

  await prisma.message.create({
    data: { sessionId: session.id, role: 'user', content: question }
  });

  const recentMessages = await prisma.message.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: 'desc' },
    take: 6
  });
  const messages = recentMessages.reverse().map(m => ({ role: m.role, content: m.content }));

  // Send sources + sessionId to frontend BEFORE streaming starts
  res.write(`data: ${JSON.stringify({ sources, sessionId: session.id })}\n\n`);

  await chatStream(messages, systemPrompt, res, async (fullAnswer) => {
    const savedMessage = await prisma.message.create({
      data: {
        sessionId: session.id,
        role:      'assistant',
        content:   fullAnswer,
        sources:   sources.length > 0 ? sources : null,
      }
    });

    res.write(`data: ${JSON.stringify({
      done:      true,
      messageId: savedMessage.id,
      sessionId: session.id,
    })}\n\n`);
    res.end();
  });
});

// ============================================================
// CHAT HISTORY — GET /api/chat/history
// ============================================================
router.get('/history', authenticateToken, checkEnrollment, async (req, res) => {
  const { courseId, sessionId } = req.query;
  let session;

  if (sessionId) {
    session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
  } else {
    session = await prisma.chatSession.findFirst({
      where: { userId: req.user.id, courseId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  if (!session) return res.json({ messages: [], sessionId: null });
  res.json({ messages: session.messages, sessionId: session.id });
});

// ============================================================
// CHAT SESSIONS — GET /api/chat/sessions
// ============================================================
router.get('/sessions', authenticateToken, async (req, res) => {
  const { courseId } = req.query;
  const sessions = await prisma.chatSession.findMany({
    where: { userId: req.user.id, courseId },
    include: { messages: { take: 1, orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(sessions);
});

// ============================================================
// SEARCH PAST CHATS
// ============================================================
router.get('/search', authenticateToken, async (req, res) => {
  const { q, courseId } = req.query;
  if (!q) return res.json({ results: [] });
  const messages = await prisma.message.findMany({
    where: {
      content: { contains: q, mode: 'insensitive' },
      session: { userId: req.user.id, courseId: courseId || undefined }
    },
    include: { session: true },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  res.json({ results: messages });
});

module.exports = router;