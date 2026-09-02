// ============================================================
// admin.js — Admin CRUD Routes (Delete/Edit Operations)
// ============================================================
// Endpoints for managing courses, materials, and enrollments
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
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// COURSES — DELETE
// ============================================================
router.delete('/course/:courseId', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;

    console.log(`🗑️  Deleting course: ${courseId}`);

    // Delete in order: messages → chatSessions → materials → chunks → enrollments → course

    // 1. Delete all messages in chat sessions for this course
    await prisma.message.deleteMany({
      where: {
        session: {
          courseId: courseId
        }
      }
    });

    // 2. Delete all chat sessions for this course
    await prisma.chatSession.deleteMany({
      where: { courseId: courseId }
    });

    // 3. Delete all material chunks for this course
    await prisma.materialChunk.deleteMany({
      where: { courseId: courseId }
    });

    // 4. Delete all materials for this course
    await prisma.material.deleteMany({
      where: { courseId: courseId }
    });

    // 5. Delete all enrollments for this course
    await prisma.enrollment.deleteMany({
      where: { courseId: courseId }
    });

    // 6. Finally, delete the course
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
// COURSES — UPDATE (Edit name/description)
// ============================================================
router.put('/course/:courseId', authenticateToken, checkAdmin, async (req, res) => {
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
// MATERIALS — DELETE
// ============================================================
router.delete('/material/:materialId', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { materialId } = req.params;

    console.log(`🗑️  Deleting material: ${materialId}`);

    // 1. Delete all material chunks (cascading delete should handle this)
    await prisma.materialChunk.deleteMany({
      where: { materialId: materialId }
    });

    // 2. Delete the material
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
router.delete('/enrollment/:enrollmentId', authenticateToken, checkAdmin, async (req, res) => {
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
// GET ALL COURSES (for admin dashboard)
// ============================================================
router.get('/courses', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        enrollments: { select: { id: true } },
        materials: { select: { id: true } }
      }
    });

    res.json({
      courses: courses.map(c => ({
        id: c.id,
        name: c.name,
        subject: c.subject,
        description: c.description,
        studentCount: c.enrollments.length,
        materialCount: c.materials.length,
        createdAt: c.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET COURSE DETAILS (with enrollments and materials)
// ============================================================
router.get('/course/:courseId', authenticateToken, checkAdmin, async (req, res) => {
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
// GET COURSE MATERIALS (with chunk count)
// ============================================================
router.get('/course/:courseId/materials', authenticateToken, checkAdmin, async (req, res) => {
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
// DELETE USER (admin only - optional)
// ============================================================
router.delete('/user/:userId', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`🗑️  Deleting user: ${userId}`);

    // Delete related data first
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
// DATABASE STATS (for testing)
// ============================================================
router.get('/stats', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const stats = {
      users: await prisma.user.count(),
      courses: await prisma.course.count(),
      enrollments: await prisma.enrollment.count(),
      materials: await prisma.material.count(),
      chunks: await prisma.materialChunk.count(),
      chatSessions: await prisma.chatSession.count(),
      messages: await prisma.message.count(),
      bookmarks: await prisma.bookmark.count()
    };

    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;