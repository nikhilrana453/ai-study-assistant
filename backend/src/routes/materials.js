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

// ============================================================
// UPLOAD MATERIAL — POST /api/materials/upload
// ============================================================
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

    try {
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

      console.log(`📤 Material created: ${material.id} - ${title}`);
      console.log(`🔄 Starting background processing...`);

      // Process material in background BUT track completion
      processMaterial(material)
        .then(() => {
          console.log(`✅ Material processing complete: ${title}`);
        })
        .catch((err) => {
          console.error(`❌ Material processing FAILED for ${title}:`, err.message);
          // Log to database for debugging
          console.error(err.stack);
        });

      res.status(201).json({
        message: 'File uploaded and being processed for AI search',
        material,
        note: 'Processing in background. Check server logs for progress.'
      });
    } catch (err) {
      console.error('❌ Upload error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// ============================================================
// DEBUG — Check if chunks exist for a course
// ============================================================
router.get('/debug/chunks', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { courseId } = req.query;

    const chunks = await prisma.materialChunk.findMany({
      where: { courseId },
      select: {
        id: true,
        materialTitle: true,
        chunkIndex: true,
        text: true,
        embedding: true,
        createdAt: true
      },
      take: 10
    });

    const totalChunks = await prisma.materialChunk.count({
      where: { courseId }
    });

    const materials = await prisma.material.findMany({
      where: { courseId },
      select: { id: true, title: true, createdAt: true }
    });

    res.json({
      totalChunks,
      chunksSample: chunks.map(c => ({
        ...c,
        embedding: c.embedding ? `[${c.embedding.slice(0, 3).join(', ')}...]` : null,
        textPreview: c.text.substring(0, 100)
      })),
      materials
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// DEBUG — Force reprocess a material
// ============================================================
router.post('/debug/reprocess', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { materialId } = req.body;

    if (!materialId) {
      return res.status(400).json({ error: 'materialId required' });
    }

    const material = await prisma.material.findUnique({
      where: { id: materialId }
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Delete existing chunks for this material
    const deleted = await prisma.materialChunk.deleteMany({
      where: { materialId }
    });

    console.log(`🗑️  Deleted ${deleted.count} existing chunks`);

    // Reprocess
    console.log(`♻️  Reprocessing material: ${material.title}`);
    await processMaterial(material);

    // Check results
    const newChunks = await prisma.materialChunk.count({
      where: { materialId }
    });

    res.json({
      message: 'Material reprocessed',
      deletedChunks: deleted.count,
      newChunks
    });
  } catch (err) {
    console.error('❌ Reprocess error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// SUMMARISE — POST /api/materials/summarise
// ============================================================
router.post('/summarise', authenticateToken, checkEnrollment, async (req, res) => {
  const { courseId } = req.body;
  if (!courseId) return res.status(400).json({ error: 'courseId required' });

  try {
    const { searchMaterials } = require('../services/ragService');
    const { chat } = require('../services/openaiService');

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

// ============================================================
// LIST MATERIALS — GET /api/materials
// ============================================================
router.get('/', authenticateToken, checkEnrollment, async (req, res) => {
  const { courseId } = req.query;
  const materials = await prisma.material.findMany({
    where: { courseId },
    orderBy: { createdAt: 'desc' }
  });
  res.json(materials);
});

module.exports = router;