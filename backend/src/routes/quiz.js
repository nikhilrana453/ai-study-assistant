// quiz.js — Generate MCQ quiz from lecture notes
const express = require('express');
const router  = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { checkEnrollment }   = require('../middleware/checkEnrollment');
const { chat }              = require('../services/openaiService');
const { searchMaterials }   = require('../services/ragService');
const prisma                = require('../prismaClient');

// POST /api/quiz/generate — generate 5 MCQ questions
router.post('/generate', authenticateToken, checkEnrollment, async (req, res) => {
  const { courseId, topic } = req.body;

  if (!courseId) {
    return res.status(400).json({ error: 'courseId required' });
  }

  try {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Search for relevant material
    const searchQuery = topic || 'main concepts topics key points';
    const chunks = await searchMaterials(searchQuery, courseId);

    if (chunks.length === 0) {
      return res.status(404).json({ error: 'No materials found. Please upload lecture notes first.' });
    }

    const context = chunks.slice(0, 4).map(c => c.text).join('\n\n');

    const systemPrompt = `You are a quiz generator for "${course.name}".
Generate exactly 5 multiple choice questions based ONLY on the TEXT below.
Return your response as valid JSON only — no markdown, no explanation.
Format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "answer": "A",
      "explanation": "Brief explanation from the notes"
    }
  ]
}

TEXT:
${context}`;

    const rawResponse = await chat(
      [{ role: 'user', content: 'Generate 5 quiz questions from the provided material.' }],
      systemPrompt
    );

    // Parse JSON response
    const cleaned = rawResponse.replace(/```json|```/g, '').trim();
    const quizData = JSON.parse(cleaned);

    res.json(quizData);
  } catch (err) {
    console.error('Quiz generation error:', err);
    res.status(500).json({ error: 'Failed to generate quiz. Please try again.' });
  }
});

module.exports = router;