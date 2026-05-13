const express = require('express');
const prisma = require('../prismaClient');
const { authenticateToken } = require('../middleware/auth');
const { checkEnrollment } = require('../middleware/checkEnrollment');
const { chat } = require('../services/ollamaService');

const router = express.Router();

// TEMPORARY TEST ROUTE - no auth needed
router.get('/test', async (req, res) => {
  try {
    const answer = await chat(
      [{ role: 'user', content: 'Say hello in one sentence' }],
      'You are a helpful assistant'
    );
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/message
router.post('/message', authenticateToken, checkEnrollment, async (req, res) => {
  const { question, courseId, hintMode } = req.body;

  if (!question || !courseId)
    return res.status(400).json({ error: 'question and courseId required' });

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course)
    return res.status(404).json({ error: 'Course not found' });

  const systemPrompt = hintMode
    ? `You are a helpful study tutor for the course "${course.name}".
       Do NOT give the full answer directly.
       Guide the student with hints and ask questions to make them think.
       Keep hints short and encouraging.`
    : `You are a helpful study tutor for the course "${course.name}".
       Answer questions clearly and accurately.
       Be concise, educational and encouraging.`;

  let session = await prisma.chatSession.findFirst({
    where: { userId: req.user.id, courseId }
  });

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
    take: 10
  });

  const messages = recentMessages
    .reverse()
    .map(m => ({ role: m.role, content: m.content }));

  const answer = await chat(messages, systemPrompt);

  const savedMessage = await prisma.message.create({
    data: { sessionId: session.id, role: 'assistant', content: answer }
  });

  res.json({ answer, messageId: savedMessage.id, sessionId: session.id });
});

// GET /api/chat/history?courseId=xxx
router.get('/history', authenticateToken, checkEnrollment, async (req, res) => {
  const { courseId } = req.query;

  const session = await prisma.chatSession.findFirst({
    where: { userId: req.user.id, courseId },
    include: { messages: { orderBy: { createdAt: 'asc' } } }
  });

  if (!session) return res.json({ messages: [] });
  res.json({ messages: session.messages, sessionId: session.id });
});

// GET /api/chat/sessions?courseId=xxx
router.get('/sessions', authenticateToken, async (req, res) => {
  const { courseId } = req.query;

  const sessions = await prisma.chatSession.findMany({
    where: { userId: req.user.id, courseId },
    include: {
      messages: { take: 1, orderBy: { createdAt: 'asc' } }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(sessions);
});

module.exports = router;