const express = require('express');
const prisma = require('../prismaClient');
const { authenticateToken } = require('../middleware/auth');
const { checkEnrollment } = require('../middleware/checkEnrollment');
const { chat } = require('../services/ollamaService');
const { searchMaterials } = require('../services/ragService');

const router = express.Router();

// TEST ROUTE
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

// COURSE ID HELPER - get all course ids
router.get('/course-id-helper', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      select: { id: true, name: true }
    });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CHECK CHUNKS ROUTE - see what was extracted from PDF
router.get('/check-chunks', async (req, res) => {
  try {
    const results = await searchMaterials(
      'metaphors UI design',
      req.query.courseId
    );
    res.json({
      chunksFound: results.length,
      content: results.map(r => ({
        text: r.text,
        source: r.metadata.materialTitle
      }))
    });
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

  // Build strict system prompt
  const systemPrompt = hintMode
  ? `SYSTEM: You are a tutor for "${course.name}".
     RULE 1: Use ONLY the TEXT section below. Nothing else.
     RULE 2: Give hints only. No direct answers.
     RULE 3: If topic not in TEXT say exactly: "This is not covered in your uploaded materials."
     RULE 4: Do not use internet knowledge. Do not make up examples.
     RULE 5: Do NOT ask follow up questions.
     RULE 6: Do NOT say "Would you like to know more".
     RULE 7: End your answer after listing the points from the TEXT.

     TEXT:
     ${context.length > 0 ? context : 'NO MATERIALS FOUND FOR THIS TOPIC.'}`
  : `SYSTEM: You are a tutor for "${course.name}".
     RULE 1: Read the TEXT section below carefully.
     RULE 2: Answer using ONLY information from the TEXT section.
     RULE 3: Start your answer with "According to your lecture notes:"
     RULE 4: Copy bullet points word for word from the TEXT below.
     RULE 5: Do NOT add examples not in the TEXT.
     RULE 6: Do NOT use any outside knowledge.
     RULE 7: Do NOT ask follow up questions like "Would you like to know more".
     RULE 8: Do NOT add closing sentences.
     RULE 9: Stop after listing all relevant points from the TEXT.
     RULE 10:"This topic is not in your uploaded course materials."

     TEXT:
     ${context.length > 0 ? context : 'NO MATERIALS FOUND FOR THIS TOPIC.'}`;
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

// GET /api/chat/history
router.get('/history', authenticateToken, checkEnrollment, async (req, res) => {
  const { courseId } = req.query;
  const session = await prisma.chatSession.findFirst({
    where: { userId: req.user.id, courseId },
    include: { messages: { orderBy: { createdAt: 'asc' } } }
  });
  if (!session) return res.json({ messages: [] });
  res.json({ messages: session.messages, sessionId: session.id });
});

// GET /api/chat/sessions
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