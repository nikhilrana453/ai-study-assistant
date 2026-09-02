// ============================================================
// ragService.js — Retrieval-Augmented Generation Service
// ============================================================
// Now uses PostgreSQL + pgvector instead of ChromaDB
// ============================================================

const { embed } = require('./openaiService');
const { addDocuments, searchDocuments } = require('./vectorService');
const { extractText } = require('./fileParser');

// ── Topic-based chunking ───────────────────────────────────────────────────
// Splits on double newlines (paragraph/slide breaks) instead of word count
// This keeps related content together in the same chunk
const chunkByTopic = (text) => {
  const sections = text.split(/\n\n+/);
  const chunks   = [];
  let current    = '';

  for (const section of sections) {
    const cleaned = section.trim();
    if (!cleaned || cleaned.length < 10) continue;

    if ((current + '\n' + cleaned).length > 1000) {
      if (current.trim().length > 20) chunks.push(current.trim());
      current = cleaned;
    } else {
      current = current ? current + '\n' + cleaned : cleaned;
    }
  }

  if (current.trim().length > 20) chunks.push(current.trim());

  // Fallback to word-based if only 1 chunk produced
  if (chunks.length <= 1) return chunkByWords(text, 200);

  return chunks;
};

// Fallback word-based chunking
const chunkByWords = (text, chunkSize = 200) => {
  const words  = text.split(' ');
  const chunks = [];
  let current  = [];

  for (const word of words) {
    current.push(word);
    if (current.length >= chunkSize) {
      chunks.push(current.join(' '));
      current = [];
    }
  }

  if (current.length > 0) chunks.push(current.join(' '));
  return chunks;
};

// ── Process uploaded material ──────────────────────────────────────────────
// Extracts text → chunks → embeds → stores in PostgreSQL
const processMaterial = async (material) => {
  try {
    console.log(`📄 Processing material: ${material.title}`);

    // Extract text from file (PDF, Word, etc)
    const text = await extractText(material.filePath, material.type);
    if (!text || text.trim().length === 0) {
      console.log('❌ No text extracted from file');
      return;
    }

    console.log(`✂️  Extracted ${text.length} characters`);

    // Use topic-based chunking to preserve context
    const chunks = chunkByTopic(text);
    console.log(`🔀 Created ${chunks.length} chunks`);

    const documents = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk.trim().length < 10) continue;

      // Generate embedding using OpenAI
      console.log(`  📊 Embedding chunk ${i + 1}/${chunks.length}...`);
      const embedding = await embed(chunk);

      documents.push({
        id: `${material.id}_chunk_${i}`,
        text: chunk,
        embedding,
        metadata: {
          materialId:    material.id,
          materialTitle: material.title,
          courseId:      material.courseId,
          topic:         material.topic || '',
          week:          material.week ? String(material.week) : '',
          chunkIndex:    String(i)
        }
      });
    }

    // Store all chunks in PostgreSQL with pgvector
    if (documents.length > 0) {
      await addDocuments(material.courseId, documents);
      console.log(`✅ Stored ${documents.length} chunks for "${material.title}"`);
    }
  } catch (err) {
    console.error('❌ Error processing material:', err.message);
    throw err;
  }
};

// ── Search for relevant materials ─────────────────────────────────────────
// Uses pgvector cosine similarity search
const searchMaterials = async (question, courseId) => {
  try {
    console.log(`🔍 Searching for: "${question}"`);

    // Expand query for scope/objective type questions
    const scopeKeywords = ['scope', 'learn', 'objective', 'outcome', 'module', 'topic', 'cover', 'should', 'measuring', 'control', 'countermeasure'];
    const isScopeQuestion = scopeKeywords.some(k => question.toLowerCase().includes(k));
    const searchQuery = isScopeQuestion
      ? question + ' controls measuring countermeasure objectives outcomes'
      : question;

    console.log(`📝 Search query: "${searchQuery}"`);

    // Get embedding for the question
    console.log(`🔑 Generating query embedding...`);
    const queryEmbedding = await embed(searchQuery);

    // Search using pgvector similarity (returns top 5)
    console.log(`🗄️  Querying PostgreSQL pgvector...`);
    const results = await searchDocuments(courseId, queryEmbedding, 5);

    if (!results || !results.documents || results.documents[0].length === 0) {
      console.log(`⚠️  No relevant chunks found for course ${courseId}`);
      return [];
    }

    // Format results
    const chunks = results.documents[0].map((doc, i) => ({
      text:     doc,
      metadata: results.metadatas[0][i],
      distance: results.distances[0][i]
    }));

    // Filter by distance threshold (cosine distance < 1.8 is good)
    const filtered = chunks.filter(chunk => chunk.distance < 1.8);

    console.log(`✅ Found ${filtered.length} relevant chunks (distance < 1.8)`);
    filtered.forEach((chunk, i) => {
      console.log(`  [${i + 1}] Distance: ${chunk.distance.toFixed(2)} | Source: ${chunk.metadata.materialTitle}`);
    });

    return filtered;
  } catch (err) {
    console.error('❌ Error searching materials:', err.message);
    return [];
  }
};

module.exports = { processMaterial, searchMaterials };