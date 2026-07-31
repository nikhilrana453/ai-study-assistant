const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken, requireAdmin);

// Create course
router.post('/courses', async (req, res) => {
  const { name, subject, description } = req.body;
  if (!name || !subject) return res.status(400).json({ error: 'Name and subject required' });
  const course = await prisma.course.create({ data: { name, subject, description } });
  res.status(201).json(course);
});

// Get all courses
router.get('/courses', async (req, res) => {
  const courses = await prisma.course.findMany({ include: { _count: { select: { enrollments: true, materials: true } } } });
  res.json(courses);
});

// Get all users
router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });
  res.json(users);
});

// Enroll student
router.post('/enroll', async (req, res) => {
  const { userId, courseId } = req.body;
  if (!userId || !courseId) return res.status(400).json({ error: 'userId and courseId required' });
  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId }
  });
  res.status(201).json(enrollment);
});

// Remove enrollment
router.delete('/enroll', async (req, res) => {
  const { userId, courseId } = req.body;
  await prisma.enrollment.delete({
    where: { userId_courseId: { userId, courseId } }
  });
  res.json({ message: 'Enrollment removed' });
});

module.exports = router;