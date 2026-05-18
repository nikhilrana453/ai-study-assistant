const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../prismaClient');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { checkEnrollment } = require('../middleware/checkEnrollment');

const router = express.Router();

// Setup multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads', req.body.courseId || 'general');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, DOC, TXT files are allowed'));
    }
  }
});

// POST /api/materials/upload (admin only)
router.post(
  '/upload',
  authenticateToken,
  requireAdmin,
  upload.single('file'),
  async (req, res) => {
    if (!req.file)
      return res.status(400).json({ error: 'No file uploaded' });

    const { courseId, title, topic, week } = req.body;

    if (!courseId || !title)
      return res.status(400).json({ error: 'courseId and title required' });

    const material = await prisma.material.create({
      data: {
        courseId,
        title,
        type: req.file.mimetype,
        filePath: req.file.path,
        topic: topic || null,
        week: week ? parseInt(week) : null
      }
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      material
    });
  }
);

// GET /api/materials?courseId=xxx (enrolled students only)
router.get('/', authenticateToken, checkEnrollment, async (req, res) => {
  const { courseId } = req.query;

  const materials = await prisma.material.findMany({
    where: { courseId },
    orderBy: { createdAt: 'desc' }
  });

  res.json(materials);
});

module.exports = router;