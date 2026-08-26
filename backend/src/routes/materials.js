const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../prismaClient');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { checkEnrollment } = require('../middleware/checkEnrollment');
const { processMaterial } = require('../services/ragService');

const router = express.Router();

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
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type'));
  }
});

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

    // Process material in background (dont wait for it)
    processMaterial(material).catch(console.error);

    res.status(201).json({
      message: 'File uploaded and being processed for AI search',
      material
    });
  }
);

// POST /api/materials/summarise
router.post('/summarise', authenticateToken, checkEnrollment, async (req, res) => {
  const { courseId } = req.body;
  if (!courseId) return res.status(400).json({ error: 'courseId required' });

  try {
    const { searchMaterials } = require('../services/ragService');
    const { chat }            = require('../services/openaiService');

    const chunks = await searchMaterials('key concepts summary overview main topics', courseId);
    if (chunks.length === 0) {
      return res.status(404).json({ error: 'No materials found. Please upload lecture notes first.' });
    }

    const context = chunks.slice(0, 5).map(c => c.text).join('\n\n');

    const systemPrompt = `You are a study assistant.
Summarise the TEXT below in a clear, student-friendly way.
Use plain language.
Structure your summary with these sections:
- Key Topics Covered
- Main Concepts and Definitions
- Important Takeaways
Keep the total summary under 400 words.
TEXT:
${context}`;

    const summary = await chat(
      [{ role: 'user', content: 'Summarise the course materials.' }],
      systemPrompt
    );

    res.json({ summary, chunksUsed: chunks.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticateToken, checkEnrollment, async (req, res) => {
  const { courseId } = req.query;
  const materials = await prisma.material.findMany({
    where: { courseId },
    orderBy: { createdAt: 'desc' }
  });
  res.json(materials);
});

module.exports = router;