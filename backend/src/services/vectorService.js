// ============================================================
// vectorService.js — PostgreSQL pgvector Implementation
// ============================================================
// Replaces ChromaDB. Uses Neon PostgreSQL with pgvector extension
// for all vector operations (storage + similarity search)
// ============================================================

const prisma = require('../prismaClient');

/**
 * Search for similar documents using pgvector cosine similarity
 * @param {string} courseId - Course ID to filter by
 * @param {number[]} queryEmbedding - The query embedding vector
 * @param {number} limit - Number of results to return
 * @returns {Promise<Array>} - Similar chunks with metadata and distance
 */
const searchDocuments = async (courseId, queryEmbedding, limit = 5) => {
  try {
    // Convert embedding array to pgvector format: [x,y,z]
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // Use raw SQL for pgvector cosine similarity search
    // <=> operator = cosine distance (0 = identical, 2 = opposite)
    const results = await prisma.$queryRaw`
      SELECT
        id,
        text,
        embedding,
        "materialId",
        "materialTitle",
        "courseId",
        topic,
        week,
        "chunkIndex",
        -- Calculate cosine distance (lower = more similar)
        (embedding <=> ${embeddingStr}::vector) AS distance
      FROM "MaterialChunk"
      WHERE "courseId" = ${courseId}
      -- Filter by distance threshold (0-2 scale, lower = better)
      AND (embedding <=> ${embeddingStr}::vector) < 1.8
      ORDER BY distance ASC
      LIMIT ${limit}
    `;

    if (!results || results.length === 0) {
      console.log(`No matching documents found for course ${courseId}`);
      return { documents: [[]], metadatas: [[]], distances: [[]] };
    }

    // Format results to match ChromaDB-like response structure
    // This maintains compatibility with ragService.js
    const documents = results.map(r => r.text);
    const metadatas = results.map(r => ({
      materialId: r.materialId,
      materialTitle: r.materialTitle,
      courseId: r.courseId,
      topic: r.topic || '',
      week: r.week || '',
      chunkIndex: r.chunkIndex
    }));
    const distances = results.map(r => r.distance);

    console.log(`✅ Found ${documents.length} similar chunks (distance < 1.8)`);

    return {
      documents: [documents],
      metadatas: [metadatas],
      distances: [distances]
    };

  } catch (error) {
    console.error('❌ Vector search error:', error.message);

    // If pgvector not installed, give helpful error
    if (error.message.includes('vector')) {
      console.error('⚠️  pgvector extension may not be installed in Neon.');
      console.error('Run: CREATE EXTENSION IF NOT EXISTS vector;');
    }

    return { documents: [[]], metadatas: [[]], distances: [[]] };
  }
};

/**
 * Add/store documents with embeddings in PostgreSQL
 * (Called by ragService.js during material processing)
 */
const addDocuments = async (courseId, documents) => {
  try {
    // Prisma doesn't handle pgvector insertion well,
    // so use raw SQL for bulk insert
    for (const doc of documents) {
      // Convert embedding array to pgvector format
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

    console.log(`✅ Stored ${documents.length} document chunks in PostgreSQL`);
    return true;

  } catch (error) {
    console.error('❌ Error storing documents:', error.message);
    throw error;
  }
};

/**
 * Clear all chunks for a specific course (for re-indexing)
 */
const clearCourse = async (courseId) => {
  try {
    const result = await prisma.materialChunk.deleteMany({
      where: { courseId }
    });
    console.log(`✅ Cleared ${result.count} chunks for course ${courseId}`);
    return result.count;
  } catch (error) {
    console.error('❌ Error clearing course:', error.message);
    throw error;
  }
};

/**
 * Get collection (no-op for pgvector, kept for compatibility)
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