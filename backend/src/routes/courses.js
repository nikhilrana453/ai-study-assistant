const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/my-courses', authenticateToken, async (req, res) => {
  if (req.user.role === 'ADMIN') {
    const all = await prisma.course.findMany();
    return res.json(all);
  }
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: req.user.id },
    include: { course: true }
  });
  res.json(enrollments.map((e) => e.course));
});

module.exports = router;