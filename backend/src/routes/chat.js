// ============================================================
// chat.js — Chat Routes for AI Study Assistant
// ============================================================
 
const express = require('express');
const router  = express.Router();
const prisma  = require('../prismaClient');
 
const { authenticateToken } = require('../middleware/auth');
const { checkEnrollment }   = require('../middleware/checkEnrollment');
const { chat, chatStream }  = require('../services/openaiService');
const { searchMaterials }   = require('../services/ragService');
 
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
// HELPER — Build system prompt
// ============================================================
const buildSystemPrompt = (courseName, context, hintMode) => {
  const textSection = context.length > 0 ? context : 'NO MATERIALS FOUND.';
 
  if (hintMode) {
    return `You are a study tutor for "${courseName}".
Use ONLY the TEXT below to give a short guiding hint.
Do not give direct answers — guide the student to think for themselves.
Write your hint ONCE only — never repeat any sentence.
Do not use markdown symbols like ** or * or #.
Do not ask follow up questions.
Write in plain sentences only.
If the topic is not in the TEXT below, say only:
"This topic is beyond the scope of this course. Please refer to your lecturer for further guidance."
 
TEXT:
${textSection}`;
  }
 
  return `You are a study tutor for "${courseName}".
Answer using ONLY the information in the TEXT below.
Write your answer ONCE — never repeat any sentence or bullet point.
Do not use markdown symbols like ** or * or #.
Use a dash - for bullet points.
Do not add examples not found in the TEXT.
Do not use outside knowledge.
Do not ask follow up questions.
Do not add closing sentences like "Would you like to know more".
Stop after listing all relevant points from the TEXT.
If the topic is not in the TEXT below, say only:
"This topic is beyond the scope of this course. Please refer to your lecturer for further guidance."
 
TEXT:
${textSection}`;
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
// COURSE ID HELPER — GET /api/chat/course-id-helper
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
// CHECK CHUNKS — GET /api/chat/check-chunks?courseId=xxx
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
 
  const scopeKeywords = ['scope', 'learn', 'objective', 'outcome', 'module', 'topic', 'cover', 'should', 'measuring', 'control'];
  const isScopeQuestion = scopeKeywords.some(k => question.toLowerCase().includes(k));
  const searchQuery = isScopeQuestion ? question + ' scope objectives outcomes session controls' : question;
 
  const relevantChunks = await searchMaterials(searchQuery, courseId);
  let context = '';
  let sources = [];
 
  if (relevantChunks.length > 0) {
    const topChunks = relevantChunks.slice(0, 3);
    context = '\n\nRelevant course materials:\n' +
      topChunks.map((chunk, i) =>
        `[Source ${i + 1}: ${chunk.metadata.materialTitle}]\n${chunk.text.substring(0, 800)}`
      ).join('\n\n');
    sources = [...new Set(topChunks.map(c => c.metadata.materialTitle))];
  }
 
  const systemPrompt = buildSystemPrompt(course.name, context, hintMode);
 
  // Use existing session or create new one
  let session = null;
  if (existingSessionId) {
    session = await prisma.chatSession.findUnique({ where: { id: existingSessionId } });
  }
  if (!session) {
    session = await prisma.chatSession.findFirst({ where: { userId: req.user.id, courseId } });
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
  // ── KEY CHANGE: also read sessionId from frontend ─────────
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
    res.write(`data: ${JSON.stringify({ token: safetyCheck.reason, done: true })}\n\n`);
    res.end();
    return;
  }
 
  // Guardrail 2
  const scopeCheck = checkScope(question);
  if (!scopeCheck.inScope) {
    res.write(`data: ${JSON.stringify({ token: scopeCheck.reason, done: true })}\n\n`);
    res.end();
    return;
  }
 
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    res.write(`data: ${JSON.stringify({ error: 'Course not found' })}\n\n`);
    res.end();
    return;
  }
 
  // Expand query
  const scopeKeywords = ['scope', 'learn', 'objective', 'outcome', 'module', 'topic', 'cover', 'should', 'measuring', 'control'];
  const isScopeQuestion = scopeKeywords.some(k => question.toLowerCase().includes(k));
  const searchQuery = isScopeQuestion ? question + ' scope objectives outcomes session controls' : question;
 
  // RAG search
  const relevantChunks = await searchMaterials(searchQuery, courseId);
  let context = '';
  let sources = [];
 
  if (relevantChunks.length > 0) {
    const topChunks = relevantChunks.slice(0, 3);
    context = '\n\nRelevant course materials:\n' +
      topChunks.map((chunk, i) =>
        `[Source ${i + 1}: ${chunk.metadata.materialTitle}]\n${chunk.text.substring(0, 800)}`
      ).join('\n\n');
    sources = [...new Set(topChunks.map(c => c.metadata.materialTitle))];
  }
 
  const systemPrompt = buildSystemPrompt(course.name, context, hintMode);
 
  // ── Session logic: use existing or create new ─────────────
  // If frontend sends sessionId → use that session (continuing chat)
  // If frontend sends null/undefined → create NEW session (new chat)
  let session = null;
 
  if (existingSessionId) {
    // Continue existing session
    session = await prisma.chatSession.findUnique({
      where: { id: existingSessionId }
    });
  }
 
  if (!session) {
    // Create a brand new session (New Chat clicked)
    session = await prisma.chatSession.create({
      data: { userId: req.user.id, courseId }
    });
  }
 
  // Save user message
  await prisma.message.create({
    data: { sessionId: session.id, role: 'user', content: question }
  });
 
  // Get recent messages for AI context
  const recentMessages = await prisma.message.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: 'desc' },
    take: 6
  });
  const messages = recentMessages.reverse().map(m => ({ role: m.role, content: m.content }));
 
  // Send sources + sessionId to frontend before streaming
  res.write(`data: ${JSON.stringify({ sources, sessionId: session.id })}\n\n`);
 
  // Stream answer AND save to database when done
  await chatStream(messages, systemPrompt, res, async (fullAnswer) => {
    // Save complete AI answer to database
    const savedMessage = await prisma.message.create({
      data: {
        sessionId: session.id,
        role:      'assistant',
        content:   fullAnswer,
        sources:   sources.length > 0 ? sources : null,
      }
    });
 
    // Send messageId to frontend so feedback/bookmark buttons appear
    res.write(`data: ${JSON.stringify({ done: true, messageId: savedMessage.id })}\n\n`);
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
// SEARCH PAST CHATS — GET /api/chat/search
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