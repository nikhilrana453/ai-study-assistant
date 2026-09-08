// ============================================================
// admin.js — Admin CRUD Routes (Delete/Edit Operations)
// ============================================================
// Endpoints for managing courses, materials, and enrollments
//
// Changes in this version (only /stats and /analytics touched):
//   /stats     — added aiMessages, thumbsUp, thumbsDown and
//                satisfactionRate INSIDE the existing `stats`
//                object. Purely additive, so anything already
//                reading data.stats.users keeps working.
//   /analytics — field names now match what the dashboard reads:
//                  dailyActivity[].date   (ISO, was `day` = "Mon")
//                  courseStats[].questions/.answers (was `enrollment`)
//                  recentQuestions[].content/.createdAt
//                  materialsPerCourse[].enrollments added
// ============================================================

const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { authenticateToken } = require('../middleware/auth');

// ============================================================
// MIDDLEWARE — Check if user is ADMIN
// ============================================================
const checkAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// GET ALL COURSES (for admin dashboard)
// ============================================================
router.get('/courses', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        _count: {
          select: {
            enrollments: true,
            materials: true
          }
        }
      }
    });

    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET ALL USERS (for admin dashboard)
// ============================================================
router.get('/users', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// COURSES — DELETE
// ============================================================
router.delete('/courses/:courseId', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;

    console.log(`🗑️  Deleting course: ${courseId}`);

    // Delete in order: messages → chatSessions → materials → chunks → enrollments → course

    await prisma.message.deleteMany({
      where: {
        session: {
          courseId: courseId
        }
      }
    });

    await prisma.chatSession.deleteMany({
      where: { courseId: courseId }
    });

    await prisma.materialChunk.deleteMany({
      where: { courseId: courseId }
    });

    await prisma.material.deleteMany({
      where: { courseId: courseId }
    });

    await prisma.enrollment.deleteMany({
      where: { courseId: courseId }
    });

    const deletedCourse = await prisma.course.delete({
      where: { id: courseId }
    });

    console.log(`✅ Course deleted: ${deletedCourse.name}`);
    res.json({
      message: `Course "${deletedCourse.name}" deleted successfully`,
      courseId: deletedCourse.id
    });
  } catch (err) {
    console.error('❌ Error deleting course:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// COURSES — CREATE
// ============================================================
router.post('/courses', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { name, subject, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Course name is required' });
    }

    const newCourse = await prisma.course.create({
      data: {
        name,
        subject: subject || '',
        description: description || ''
      }
    });

    console.log(`✅ Course created: ${newCourse.name}`);
    res.json(newCourse);
  } catch (err) {
    console.error('❌ Error creating course:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// COURSES — UPDATE (Edit name/description)
// ============================================================
router.put('/courses/:courseId', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { name, subject, description } = req.body;

    console.log(`✏️  Updating course: ${courseId}`);

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...(name && { name }),
        ...(subject && { subject }),
        ...(description && { description })
      }
    });

    console.log(`✅ Course updated: ${updatedCourse.name}`);
    res.json({
      message: 'Course updated successfully',
      course: updatedCourse
    });
  } catch (err) {
    console.error('❌ Error updating course:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ENROLL STUDENT
// ============================================================
router.post('/enroll', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({ error: 'userId and courseId are required' });
    }

    const existing = await prisma.enrollment.findFirst({
      where: { userId, courseId }
    });

    if (existing) {
      return res.status(400).json({ error: 'Student is already enrolled in this course' });
    }

    const enrollment = await prisma.enrollment.create({
      data: { userId, courseId },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { name: true } }
      }
    });

    console.log(`✅ Enrolled ${enrollment.user.name} in ${enrollment.course.name}`);
    res.json(enrollment);
  } catch (err) {
    console.error('❌ Error enrolling student:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET ALL ENROLLMENTS (admin view)
// ============================================================
router.get('/enrollments', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ enrollments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET COURSE DETAILS (with enrollments and materials)
// ============================================================
router.get('/courses/:courseId', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        materials: {
          select: { id: true, title: true, type: true, createdAt: true }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET COURSE MATERIALS (with chunk count)
// ============================================================
router.get('/courses/:courseId/materials', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;

    const materials = await prisma.material.findMany({
      where: { courseId: courseId },
      include: {
        chunks: { select: { id: true } }
      }
    });

    res.json({
      materials: materials.map(m => ({
        id: m.id,
        title: m.title,
        type: m.type,
        chunkCount: m.chunks.length,
        topic: m.topic,
        week: m.week,
        createdAt: m.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// MATERIALS — DELETE
// ============================================================
router.delete('/materials/:materialId', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { materialId } = req.params;

    console.log(`🗑️  Deleting material: ${materialId}`);

    await prisma.materialChunk.deleteMany({
      where: { materialId: materialId }
    });

    const deletedMaterial = await prisma.material.delete({
      where: { id: materialId }
    });

    console.log(`✅ Material deleted: ${deletedMaterial.title}`);
    res.json({
      message: `Material "${deletedMaterial.title}" deleted successfully`,
      materialId: deletedMaterial.id
    });
  } catch (err) {
    console.error('❌ Error deleting material:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ENROLLMENTS — DELETE (Remove student from course)
// ============================================================
router.delete('/enrollments/:enrollmentId', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    console.log(`🗑️  Deleting enrollment: ${enrollmentId}`);

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { user: true, course: true }
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    const deletedEnrollment = await prisma.enrollment.delete({
      where: { id: enrollmentId }
    });

    console.log(`✅ Enrollment deleted: ${enrollment.user.name} removed from ${enrollment.course.name}`);
    res.json({
      message: `Student "${enrollment.user.name}" removed from "${enrollment.course.name}"`,
      enrollment: deletedEnrollment
    });
  } catch (err) {
    console.error('❌ Error deleting enrollment:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// DELETE USER (admin only - optional)
// ============================================================
router.delete('/users/:userId', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`🗑️  Deleting user: ${userId}`);

    await prisma.enrollment.deleteMany({ where: { userId } });
    await prisma.bookmark.deleteMany({ where: { userId } });
    await prisma.passwordResetToken.deleteMany({ where: { userId } });

    const deletedUser = await prisma.user.delete({
      where: { id: userId }
    });

    console.log(`✅ User deleted: ${deletedUser.email}`);
    res.json({
      message: `User "${deletedUser.email}" deleted successfully`,
      userId: deletedUser.id
    });
  } catch (err) {
    console.error('❌ Error deleting user:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// HELPER — Feedback counts
// ============================================================
// Guarded deliberately. If there is no Feedback model on the Prisma
// client, `prisma.feedback` is undefined and `.count()` throws a
// synchronous TypeError — a trailing .catch() does NOT save you,
// because no promise was ever created. That would 500 the whole
// stats endpoint over an optional metric.
const getFeedbackCounts = async () => {
  try {
    if (!prisma.feedback) {
      console.warn('⚠️  No Feedback model on the Prisma client — satisfaction reported as 0.');
      return { thumbsUp: 0, thumbsDown: 0 };
    }
    const [thumbsUp, thumbsDown] = await Promise.all([
      prisma.feedback.count({ where: { rating: 1 } }),
      prisma.feedback.count({ where: { rating: -1 } })
    ]);
    return { thumbsUp, thumbsDown };
  } catch (err) {
    console.warn('⚠️  Feedback counts unavailable:', err.message);
    return { thumbsUp: 0, thumbsDown: 0 };
  }
};

// ============================================================
// DATABASE STATS
// ============================================================
router.get('/stats', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const [
      users, courses, enrollments, materials,
      chunks, chatSessions, messages, bookmarks, aiMessages
    ] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.enrollment.count(),
      prisma.material.count(),
      prisma.materialChunk.count(),
      prisma.chatSession.count(),
      prisma.message.count(),
      prisma.bookmark.count(),
      prisma.message.count({ where: { role: 'assistant' } })
    ]);

    const { thumbsUp, thumbsDown } = await getFeedbackCounts();
    const rated = thumbsUp + thumbsDown;

    const stats = {
      users,
      courses,
      enrollments,
      materials,
      chunks,
      chatSessions,
      messages,
      bookmarks,
      // Added for the analytics dashboard
      aiMessages,
      studentQuestions: messages - aiMessages,
      thumbsUp,
      thumbsDown,
      satisfactionRate: rated > 0 ? Math.round((thumbsUp / rated) * 100) : 0
    };

    res.json({ stats });
  } catch (err) {
    console.error('❌ Error fetching stats:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ANALYTICS DATA (for analytics dashboard)
// ============================================================
router.get('/analytics', authenticateToken, checkAdmin, async (req, res) => {
  try {
    // ── Materials and enrolments per course ────────────────────
    const coursesWithCounts = await prisma.course.findMany({
      select: {
        name: true,
        _count: { select: { materials: true, enrollments: true } }
      },
      orderBy: { name: 'asc' }
    });

    const materialsPerCourse = coursesWithCounts.map(c => ({
      name: c.name,
      materials: c._count.materials,
      enrollments: c._count.enrollments
    }));

    // ── Daily activity, last 7 days ───────────────────────────
    // Keyed by ISO date, not weekday name. A weekday label collides
    // as soon as the range covers the same day twice, and it is not
    // parseable by new Date() on the client.
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

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
      if (!dailyMap[key]) continue;
      if (msg.role === 'user') dailyMap[key].questions += 1;
      else                     dailyMap[key].answers   += 1;
    }

    const dailyActivity = Object.values(dailyMap);

    // ── Questions and answers per course ──────────────────────
    const sessions = await prisma.chatSession.findMany({
      select: {
        course: { select: { name: true } },
        messages: { select: { role: true } }
      }
    });

    const courseMap = {};
    for (const session of sessions) {
      const name = session.course?.name;
      if (!name) continue;
      if (!courseMap[name]) courseMap[name] = { questions: 0, answers: 0 };
      for (const msg of session.messages) {
        if (msg.role === 'user') courseMap[name].questions += 1;
        else                     courseMap[name].answers   += 1;
      }
    }

    const courseStats = Object.entries(courseMap)
      .map(([name, counts]) => ({ name, ...counts }))
      .sort((a, b) => b.questions - a.questions);

    // ── Recent student questions ──────────────────────────────
    const recentUserMessages = await prisma.message.findMany({
      where: { role: 'user' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        session: { select: { user: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const recentQuestions = recentUserMessages.map(m => ({
      id: m.id,
      content: m.content || '',
      createdAt: m.createdAt,
      studentName: m.session?.user?.name || 'Unknown'
    }));

    res.json({
      materialsPerCourse,
      dailyActivity,
      courseStats,
      recentQuestions
    });
  } catch (err) {
    console.error('❌ Error fetching analytics:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;