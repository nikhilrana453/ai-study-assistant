// feedback.js — Thumbs up/down on AI responses
const express = require('express');
const router  = express.Router();
const prisma  = require('../prismaClient');
const { authenticateToken } = require('../middleware/auth');

// POST /api/feedback — save thumbs up or down
router.post('/', authenticateToken, async (req, res) => {
  const { messageId, rating } = req.body;
  // rating: 1 = thumbs up, -1 = thumbs down

  if (!messageId || ![1, -1].includes(rating)) {
    return res.status(400).json({ error: 'messageId and rating (1 or -1) required' });
  }

  try {
    // Upsert — update if exists, create if not
    const feedback = await prisma.feedback.upsert({
      where:  { messageId },
      update: { rating },
      create: { messageId, rating },
    });
    res.json({ success: true, feedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/feedback/stats?courseId=xxx — get feedback stats for admin
router.get('/stats', authenticateToken, async (req, res) => {
  const { courseId } = req.query;
  try {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        message: {
          include: { session: true }
        }
      }
    });

    const filtered = courseId
      ? feedbacks.filter(f => f.message.session.courseId === courseId)
      : feedbacks;

    const thumbsUp   = filtered.filter(f => f.rating === 1).length;
    const thumbsDown = filtered.filter(f => f.rating === -1).length;
    const total      = filtered.length;

    res.json({
      thumbsUp,
      thumbsDown,
      total,
      satisfactionRate: total > 0 ? Math.round((thumbsUp / total) * 100) : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;