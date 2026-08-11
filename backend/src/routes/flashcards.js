// flashcards.js — Generate flashcards from lecture notes
const express = require('express');
const router  = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { checkEnrollment }   = require('../middleware/checkEnrollment');
const { chat }              = require('../services/openaiService');
const { searchMaterials }   = require('../services/ragService');
const prisma                = require('../prismaClient');

// POST /api/flashcards/generate — generate 10 flashcards
router.post('/generate', authenticateToken, checkEnrollment, async (req, res) => {
  const { courseId, topic } = req.body;

  if (!courseId) {
    return res.status(400).json({ error: 'courseId required' });
  }

  try {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const searchQuery = topic || 'key terms definitions concepts';
    const chunks = await searchMaterials(searchQuery, courseId);

    if (chunks.length === 0) {
      return res.status(404).json({ error: 'No materials found. Please upload lecture notes first.' });
    }

    const context = chunks.slice(0, 4).map(c => c.text).join('\n\n');

    const systemPrompt = `You are a flashcard generator for "${course.name}".
Generate exactly 10 flashcards based ONLY on the TEXT below.
Return valid JSON only — no markdown, no explanation.
Format:
{
  "flashcards": [
    {
      "front": "Term or question",
      "back": "Definition or answer from the notes"
    }
  ]
}

TEXT:
${context}`;

    const rawResponse = await chat(
      [{ role: 'user', content: 'Generate 10 flashcards from the provided material.' }],
      systemPrompt
    );

    const cleaned = rawResponse.replace(/```json|```/g, '').trim();
    const flashcardData = JSON.parse(cleaned);

    res.json(flashcardData);
  } catch (err) {
    console.error('Flashcard generation error:', err);
    res.status(500).json({ error: 'Failed to generate flashcards. Please try again.' });
  }
});

module.exports = router;