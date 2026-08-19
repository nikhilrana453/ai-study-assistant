const express = require('express');
const router  = express.Router();
const prisma  = require('../prismaClient');
const { authenticateToken } = require('../middleware/auth');

// ── GET /api/admin/stats ─────────────────────────────────────────────────────
// Summary cards: total students, courses, messages, materials
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [students, courses, messages, materials, sessions] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.course.count(),
      prisma.message.count(),
      prisma.material.count(),
      prisma.chatSession.count(),
    ]);

    const aiMessages = await prisma.message.count({
      where: { role: 'assistant' }
    });

    const thumbsUp = await prisma.feedback.count({
      where: { rating: 1 }
    }).catch(() => 0);

    const thumbsDown = await prisma.feedback.count({
      where: { rating: -1 }
    }).catch(() => 0);

    res.json({
      students,
      courses,
      totalMessages: messages,
      aiMessages,
      materials,
      sessions,
      thumbsUp,
      thumbsDown,
      satisfactionRate: (thumbsUp + thumbsDown) > 0
        ? Math.round((thumbsUp / (thumbsUp + thumbsDown)) * 100)
        : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/analytics ─────────────────────────────────────────────────
// Detailed charts data: top questions, usage per course, daily activity
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    // Most active courses — count messages per course
    const courseActivity = await prisma.chatSession.findMany({
      include: {
        course:   { select: { name: true } },
        messages: { select: { id: true, role: true } },
      }
    });

    const courseMap = {};
    for (const session of courseActivity) {
      const name = session.course.name;
      if (!courseMap[name]) courseMap[name] = { questions: 0, answers: 0 };
      for (const msg of session.messages) {
        if (msg.role === 'user')      courseMap[name].questions++;
        if (msg.role === 'assistant') courseMap[name].answers++;
      }
    }
    const courseStats = Object.entries(courseMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.questions - a.questions);

    // Most asked questions (user messages, most recent 50)
    const recentUserMessages = await prisma.message.findMany({
      where: { role: 'user' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { content: true, createdAt: true }
    });

    // Daily message count — last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMessages = await prisma.message.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, role: true },
      orderBy: { createdAt: 'asc' }
    });

    const dailyMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = { date: key, questions: 0, answers: 0 };
    }
    for (const msg of recentMessages) {
      const key = msg.createdAt.toISOString().split('T')[0];
      if (dailyMap[key]) {
        if (msg.role === 'user')      dailyMap[key].questions++;
        if (msg.role === 'assistant') dailyMap[key].answers++;
      }
    }
    const dailyActivity = Object.values(dailyMap);

    // Materials per course
    const materialsPerCourse = await prisma.course.findMany({
      select: {
        name: true,
        _count: { select: { materials: true, enrollments: true } }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      courseStats,
      recentQuestions: recentUserMessages.map(m => ({
        content:   m.content.substring(0, 80),
        createdAt: m.createdAt
      })),
      dailyActivity,
      materialsPerCourse: materialsPerCourse.map(c => ({
        name:        c.name,
        materials:   c._count.materials,
        enrollments: c._count.enrollments
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/admin/materials/:id ─────────────────────────────────────────
router.delete('/materials/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin only' });
    }
    await prisma.material.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/students ──────────────────────────────────────────────────
// List students with their session counts and last active date
router.get('/students', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin only' });
    }
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id:    true,
        name:  true,
        email: true,
        chatSessions: {
          select: {
            id:        true,
            createdAt: true,
            messages:  { select: { id: true } }
          }
        },
        enrollments: {
          select: { course: { select: { name: true } } }
        }
      },
      orderBy: { name: 'asc' }
    });

    const result = students.map(s => ({
      id:           s.id,
      name:         s.name,
      email:        s.email,
      sessions:     s.chatSessions.length,
      totalMessages:s.chatSessions.reduce((a, sess) => a + sess.messages.length, 0),
      courses:      s.enrollments.map(e => e.course.name),
      lastActive:   s.chatSessions.length > 0
        ? new Date(Math.max(...s.chatSessions.map(sess => new Date(sess.createdAt)))).toISOString()
        : null
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;