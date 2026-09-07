// ============================================================
// vectorService.js — PostgreSQL pgvector Implementation
// ============================================================
// Fix: do NOT select the `embedding` column. Prisma cannot
// deserialize Unsupported("vector(1536)") back into JS, which
// made every search throw. The distance is computed in SQL,
// so the raw vector is never needed on the JS side.
// ============================================================

const prisma = require('../prismaClient');

/**
 * Search for similar documents using pgvector cosine similarity
 * @param {string} courseId - Course ID to filter by
 * @param {number[]} queryEmbedding - The query embedding vector
 * @param {number} limit - Number of results to return
 * @returns {Promise<Object>} - Similar chunks with metadata and distance
 */
const searchDocuments = async (courseId, queryEmbedding, limit = 5) => {
  try {
    console.log(`🔍 Searching for similar documents in course: ${courseId}`);
    console.log(`📊 Query embedding dimensions: ${queryEmbedding.length}`);

    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // NOTE: `embedding` is deliberately absent from the SELECT list.
    // Selecting it triggers:
    //   "Failed to deserialize column of type 'vector'"
    const results = await prisma.$queryRaw`
      SELECT
        id,
        text,
        "materialId",
        "materialTitle",
        "courseId",
        topic,
        week,
        "chunkIndex",
        (embedding <=> ${embeddingStr}::vector) AS distance
      FROM "MaterialChunk"
      WHERE "courseId" = ${courseId}
        AND embedding IS NOT NULL
      ORDER BY distance ASC
      LIMIT ${limit}
    `;

    console.log(`📊 Raw search returned ${results.length} results`);

    if (!results || results.length === 0) {
      console.log(`⚠️  No chunks stored for course ${courseId}`);
      return { documents: [[]], metadatas: [[]], distances: [[]] };
    }

    results.forEach((r, i) => {
      console.log(
        `  [${i + 1}] Distance: ${parseFloat(r.distance).toFixed(3)} | "${r.materialTitle}" | ${r.text.substring(0, 60)}...`
      );
    });

    const documents = results.map(r => r.text);
    const metadatas = results.map(r => ({
      materialId: r.materialId,
      materialTitle: r.materialTitle,
      courseId: r.courseId,
      topic: r.topic || '',
      week: r.week || '',
      chunkIndex: r.chunkIndex
    }));
    const distances = results.map(r => parseFloat(r.distance));

    // Quality filter: cosine distance < 1.8 counts as a usable match
    const keep = distances.map((_, i) => i).filter(i => distances[i] < 1.8);

    console.log(`✅ ${keep.length} of ${results.length} results under distance 1.8`);

    // Fallback: if nothing clears the bar, still hand back the best few
    // rather than letting the assistant claim the topic is out of scope.
    if (keep.length === 0) {
      console.log(`⚠️  Nothing under threshold — returning top ${Math.min(3, results.length)} anyway`);
      return {
        documents: [documents.slice(0, 3)],
        metadatas: [metadatas.slice(0, 3)],
        distances: [distances.slice(0, 3)]
      };
    }

    return {
      documents: [keep.map(i => documents[i])],
      metadatas: [keep.map(i => metadatas[i])],
      distances: [keep.map(i => distances[i])]
    };

  } catch (error) {
    console.error('❌ Vector search error:', error.message);
    console.error(error.stack);

    if (error.message.includes('deserialize')) {
      console.error('⚠️  A vector column was included in the SELECT list. Remove it — distance is computed in SQL.');
    } else if (error.message.includes('type "vector" does not exist')) {
      console.error('⚠️  pgvector is not enabled. Run in Neon: CREATE EXTENSION IF NOT EXISTS vector;');
    }

    return { documents: [[]], metadatas: [[]], distances: [[]] };
  }
};

/**
 * Store document chunks with embeddings
 */
const addDocuments = async (courseId, documents) => {
  try {
    console.log(`💾 Storing ${documents.length} documents in PostgreSQL...`);

    for (const doc of documents) {
      const embeddingStr = `[${doc.embedding.join(',')}]`;

      await prisma.$executeRaw`
        INSERT INTO "MaterialChunk" (
          id,
          "materialId",
          "materialTitle",
          "courseId",
          text,
          embedding,
          "chunkIndex",
          topic,
          week,
          "createdAt"
        ) VALUES (
          ${doc.id},
          ${doc.metadata.materialId},
          ${doc.metadata.materialTitle},
          ${doc.metadata.courseId},
          ${doc.text},
          ${embeddingStr}::vector,
          ${parseInt(doc.metadata.chunkIndex)},
          ${doc.metadata.topic || null},
          ${doc.metadata.week || null},
          NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }

    console.log(`✅ Successfully stored ${documents.length} document chunks in PostgreSQL`);
    return true;

  } catch (error) {
    console.error('❌ Error storing documents:', error.message);
    console.error(error.stack);
    throw error;
  }
};

/**
 * Clear all chunks for a course (for re-indexing)
 */
const clearCourse = async (courseId) => {
  try {
    const result = await prisma.materialChunk.deleteMany({ where: { courseId } });
    console.log(`✅ Cleared ${result.count} chunks for course ${courseId}`);
    return result.count;
  } catch (error) {
    console.error('❌ Error clearing course:', error.message);
    throw error;
  }
};

/**
 * Kept for interface compatibility
 */
const getCollection = async (courseId) => {
  return { courseId };
};

module.exports = {
  searchDocuments,
  addDocuments,
  clearCourse,
  getCollection
};