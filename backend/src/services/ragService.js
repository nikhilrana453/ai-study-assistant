// ============================================================
// ragService.js — Retrieval-Augmented Generation Service
// ============================================================
// PostgreSQL + pgvector
//
// Changes:
//  - Removed query expansion. chat.js already had its own, so
//    questions containing "control" were expanded twice and the
//    embedding drifted toward generic "objectives/outcomes" text.
//  - Removed the duplicate distance filter. vectorService already
//    filters and provides a top-3 fallback; re-filtering here
//    discarded that fallback and made it dead code.
//  - Default retrieval raised from 5 to 8 chunks.
// ============================================================

const { embed } = require('./openaiService');
const { addDocuments, searchDocuments } = require('./vectorService');
const { extractText } = require('./fileParser');

// ── Topic-based chunking ───────────────────────────────────────────────────
// Splits on double newlines (paragraph/slide breaks) instead of word count
// so related content stays together in the same chunk
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

    const text = await extractText(material.filePath, material.type);
    if (!text || text.trim().length === 0) {
      console.log('❌ No text extracted from file');
      return;
    }

    console.log(`✂️  Extracted ${text.length} characters`);

    const chunks = chunkByTopic(text);
    console.log(`🔀 Created ${chunks.length} chunks`);

    const documents = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk.trim().length < 10) continue;

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
// The question is embedded AS ASKED. Do not append keyword filler here —
// it dilutes the query vector and pulls results toward whatever generic
// text those keywords resemble.
const searchMaterials = async (question, courseId, limit = 8) => {
  try {
    console.log(`🔍 Searching for: "${question}"`);

    console.log(`🔑 Generating query embedding...`);
    const queryEmbedding = await embed(question);

    console.log(`🗄️  Querying PostgreSQL pgvector (limit ${limit})...`);
    const results = await searchDocuments(courseId, queryEmbedding, limit);

    if (!results || !results.documents || results.documents[0].length === 0) {
      console.log(`⚠️  No chunks returned for course ${courseId}`);
      return [];
    }

    // vectorService has already applied the distance threshold and its
    // top-3 fallback. Filtering again here would discard that fallback.
    const chunks = results.documents[0].map((doc, i) => ({
      text:     doc,
      metadata: results.metadatas[0][i],
      distance: results.distances[0][i]
    }));

    console.log(`✅ Returning ${chunks.length} chunks to the caller`);
    chunks.forEach((chunk, i) => {
      console.log(`  [${i + 1}] Distance: ${chunk.distance.toFixed(3)} | Source: ${chunk.metadata.materialTitle}`);
    });

    return chunks;
  } catch (err) {
    console.error('❌ Error searching materials:', err.message);
    return [];
  }
};

module.exports = { processMaterial, searchMaterials };