// src/services/vectorService.js
//
// Vector storage + similarity search using pgvector on your Neon Postgres,
// accessed through Prisma's raw-query API. No ChromaDB, no Ollama, no localhost.
//
// The public interface (addDocuments / searchDocuments / deleteDocuments) and the
// SHAPE that searchDocuments returns are unchanged from your previous version,
// so ragService.js and chromaService.js do NOT need any edits.
 
const prisma = require('../prismaClient');
 
// pgvector accepts a vector literal formatted like '[0.1,0.2,0.3]'.
const toVectorLiteral = (arr) => `[${arr.join(',')}]`;
 
// Store chunks (each with its OpenAI embedding) in Postgres.
const addDocuments = async (courseId, documents) => {
  try {
    for (const doc of documents) {
      const embeddingLiteral = toVectorLiteral(doc.embedding);
 
      // We insert via raw SQL because the `embedding` column is a pgvector
      // type, which Prisma's typed client (createMany) cannot write directly.
      // Values are still parameterized, so this is safe from SQL injection.
      await prisma.$executeRaw`
        INSERT INTO "MaterialChunk"
          ("id", "materialId", "materialTitle", "courseId", "text",
           "embedding", "chunkIndex", "topic", "week", "createdAt")
        VALUES (
          ${doc.id},
          ${doc.metadata.materialId},
          ${doc.metadata.materialTitle},
          ${courseId},
          ${doc.text},
          ${embeddingLiteral}::vector,
          ${parseInt(doc.metadata.chunkIndex || '0', 10)},
          ${doc.metadata.topic || null},
          ${doc.metadata.week || null},
          NOW()
        )
        ON CONFLICT ("id") DO NOTHING
      `;
    }
 
    console.log(`✅ Stored ${documents.length} chunks in Postgres (pgvector)`);
  } catch (err) {
    console.error('Vector store error:', err);
    throw err;
  }
};
 
// Cosine-similarity search, done INSIDE Postgres with the pgvector `<=>`
// operator (cosine distance). This uses the HNSW index, so it stays fast even
// with many thousands of chunks — unlike loading every row into Node.
//
// Returns the same shape your old service returned:
//   { documents: [[...]], metadatas: [[...]], distances: [[...]] }
const searchDocuments = async (courseId, queryEmbedding, nResults = 4) => {
  try {
    const queryLiteral = toVectorLiteral(queryEmbedding);
 
    const rows = await prisma.$queryRaw`
      SELECT
        "text",
        "materialId",
        "materialTitle",
        "courseId",
        "topic",
        "week",
        "chunkIndex",
        ("embedding" <=> ${queryLiteral}::vector) AS distance
      FROM "MaterialChunk"
      WHERE "courseId" = ${courseId}
        AND "embedding" IS NOT NULL
      ORDER BY "embedding" <=> ${queryLiteral}::vector
      LIMIT ${nResults}
    `;
 
    if (!rows || rows.length === 0) {
      return { documents: [[]], metadatas: [[]], distances: [[]] };
    }
 
    return {
      documents: [rows.map((r) => r.text)],
      metadatas: [
        rows.map((r) => ({
          materialId: r.materialId,
          materialTitle: r.materialTitle,
          courseId: r.courseId,
          topic: r.topic || '',
          week: r.week || '',
          chunkIndex: String(r.chunkIndex),
        })),
      ],
      distances: [rows.map((r) => Number(r.distance))],
    };
  } catch (err) {
    console.error('Vector search error:', err);
    return null;
  }
};
 
// Delete chunks when a material is removed. This column-set doesn't touch the
// vector type, so the normal Prisma client is fine here.
const deleteDocuments = async (materialId) => {
  try {
    await prisma.materialChunk.deleteMany({ where: { materialId } });
    console.log(`✅ Deleted chunks for material ${materialId}`);
  } catch (err) {
    console.error('Delete chunks error:', err);
  }
};
 
module.exports = { addDocuments, searchDocuments, deleteDocuments };
 