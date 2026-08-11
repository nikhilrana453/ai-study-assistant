// bookmarks.js — Save and retrieve bookmarked AI answers
const express = require('express');
const router  = express.Router();
const prisma  = require('../prismaClient');
const { authenticateToken } = require('../middleware/auth');

// POST /api/bookmarks — bookmark an AI message
router.post('/', authenticateToken, async (req, res) => {
  const { messageId, courseId } = req.body;

  if (!messageId || !courseId) {
    return res.status(400).json({ error: 'messageId and courseId required' });
  }

  try {
    // Check if already bookmarked
    const existing = await prisma.bookmark.findFirst({
      where: { userId: req.user.id, messageId }
    });

    if (existing) {
      // Remove bookmark (toggle off)
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return res.json({ bookmarked: false });
    }

    // Create bookmark
    const bookmark = await prisma.bookmark.create({
      data: { userId: req.user.id, messageId, courseId }
    });
    res.json({ bookmarked: true, bookmark });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookmarks?courseId=xxx — get all bookmarks for student
router.get('/', authenticateToken, async (req, res) => {
  const { courseId } = req.query;
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId:   req.user.id,
        courseId: courseId || undefined,
      },
      include: {
        message: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/bookmarks/:id — remove a bookmark
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.bookmark.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;