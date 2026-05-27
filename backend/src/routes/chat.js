const express = require('express');
const prisma = require('../prismaClient');
const { authenticateToken } = require('../middleware/auth');
const { checkEnrollment } = require('../middleware/checkEnrollment');
const { chat } = require('../services/ollamaService');
const { searchMaterials } = require('../services/ragService');

const router = express.Router();

router.post('/message', authenticateToken, checkEnrollment, async (req, res) => {
  const { question, courseId, hintMode } = req.body;

  if (!question || !courseId)
    return res.status(400).json({ error: 'question and courseId required' });

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return res.status(404).json({ error: 'Course not found' });

  // Search for relevant materials using RAG
  const relevantChunks = await searchMaterials(question, courseId);

  // Build context from relevant materials
  let context = '';
  let sources = [];

  if (relevantChunks.length > 0) {
    context = '\n\nRelevant course materials:\n' +
      relevantChunks.map((chunk, i) =>
        `[Source ${i + 1}: ${chunk.metadata.materialTitle}]\n${chunk.text}`
      ).join('\n\n');

    sources = [...new Set(relevantChunks.map(c => c.metadata.materialTitle))];
  }

  // Build system prompt with context
  const systemPrompt = hintMode
    ? `You are a helpful study tutor for the course "${course.name}".
       Do NOT give the full answer directly.
       Guide the student with hints to make them think.
       ${context}`
    : `You are a helpful study tutor for the course "${course.name}".
       Answer questions clearly using the provided course materials.
       If materials are provided, base your answer on them.
       Always mention which materials you used.
       ${context}`;

  // Get or create chat session
  let session = await prisma.chatSession.findFirst({
    where: { userId: req.user.id, courseId }
  });

  if (!session) {
    session = await prisma.chatSession.create({
      data: { userId: req.user.id, courseId }
    });
  }

  // Save user message
  await prisma.message.create({
    data: { sessionId: session.id, role: 'user', content: question }
  });

  // Get recent messages for context
  const recentMessages = await prisma.message.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  const messages = recentMessages
    .reverse()
    .map(m => ({ role: m.role, content: m.content }));

  // Call Ollama
  const answer = await chat(messages, systemPrompt);

  // Save assistant response with sources
  const savedMessage = await prisma.message.create({
    data: {
      sessionId: session.id,
      role: 'assistant',
      content: answer,
      sources: sources.length > 0 ? sources : null
    }
  });

  res.json({
    answer,
    sources,
    messageId: savedMessage.id,
    sessionId: session.id
  });
});

router.get('/history', authenticateToken, checkEnrollment, async (req, res) => {
  const { courseId } = req.query;
  const session = await prisma.chatSession.findFirst({
    where: { userId: req.user.id, courseId },
    include: { messages: { orderBy: { createdAt: 'asc' } } }
  });
  if (!session) return res.json({ messages: [] });
  res.json({ messages: session.messages, sessionId: session.id });
});

router.get('/sessions', authenticateToken, async (req, res) => {
  const { courseId } = req.query;
  const sessions = await prisma.chatSession.findMany({
    where: { userId: req.user.id, courseId },
    include: { messages: { take: 1, orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(sessions);
});

module.exports = router;