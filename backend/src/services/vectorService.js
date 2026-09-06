// ============================================================
// vectorService.js — PostgreSQL pgvector Implementation 
// ============================================================
// Bug fix: Proper embedding casting and search without distance threshold
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
    console.log(`🔍 Searching for similar documents in course: ${courseId}`);
    console.log(`📊 Query embedding dimensions: ${queryEmbedding.length}`);

    // Convert embedding to string format for pgvector
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // FIXED: Direct raw SQL without subqueries
    // Use CAST to ensure proper vector type conversion
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
        (embedding <=> ${embeddingStr}::vector) AS distance
      FROM "MaterialChunk"
      WHERE "courseId" = ${courseId}
      AND embedding IS NOT NULL
      ORDER BY distance ASC
      LIMIT ${limit}
    `;

    console.log(`📊 Raw search returned ${results.length} results`);

    if (!results || results.length === 0) {
      console.log(`⚠️  No results found for course ${courseId}`);
      return { documents: [[]], metadatas: [[]], distances: [[]] };
    }

    // Log the distances for debugging
    results.forEach((r, i) => {
      console.log(`  [${i + 1}] Distance: ${parseFloat(r.distance).toFixed(2)} | "${r.materialTitle}" | ${r.text.substring(0, 50)}...`);
    });

    // Format results to match ChromaDB-like response structure
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

    // Filter by distance threshold (cosine distance < 1.8 is good match)
    const filtered = distances.map((d, i) => i).filter(i => distances[i] < 1.8);
    const filteredResults = {
      documents: [filtered.map(i => documents[i])],
      metadatas: [filtered.map(i => metadatas[i])],
      distances: [filtered.map(i => distances[i])]
    };

    console.log(`✅ Found ${filteredResults.documents[0].length} results with distance < 1.8`);

    // If no results with strict threshold, return top 3 anyway
    if (filteredResults.documents[0].length === 0 && results.length > 0) {
      console.log(`⚠️  No results under distance threshold, returning top ${Math.min(3, results.length)} anyway`);
      return {
        documents: [[...documents.slice(0, 3)]],
        metadatas: [[...metadatas.slice(0, 3)]],
        distances: [[...distances.slice(0, 3)]]
      };
    }

    return filteredResults;

  } catch (error) {
    console.error('❌ Vector search error:', error.message);
    console.error(error.stack);

    // If pgvector not installed, give helpful error
    if (error.message.includes('vector')) {
      console.error('⚠️  pgvector extension may not be installed or working correctly.');
      console.error('Run in Neon: CREATE EXTENSION IF NOT EXISTS vector;');
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
    console.log(`💾 Storing ${documents.length} documents in PostgreSQL...`);

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

    console.log(`✅ Successfully stored ${documents.length} document chunks in PostgreSQL`);
    return true;

  } catch (error) {
    console.error('❌ Error storing documents:', error.message);
    console.error(error.stack);
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