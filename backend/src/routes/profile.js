const express = require('express');
const router  = express.Router();
const prisma  = require('../prismaClient');
const bcrypt  = require('bcrypt');
const { authenticateToken } = require('../middleware/auth');

// GET /api/profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, role: true,
        enrollments: { select: { course: { select: { id:true, name:true } } } },
        chatSessions: {
          select: { id:true, messages: { select: { id:true, role:true } } }
        },
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const totalQuestions = user.chatSessions.reduce((a, s) =>
      a + s.messages.filter(m => m.role === 'user').length, 0);

    res.json({ ...user, totalSessions: user.chatSessions.length, totalQuestions });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/profile
router.put('/', authenticateToken, async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updateData = {};
    if (name?.trim()) updateData.name = name.trim();

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password required' });
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
      if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data:  updateData,
      select: { id:true, name:true, email:true, role:true }
    });

    res.json({ message: 'Profile updated successfully', user: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;