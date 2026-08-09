const prisma = require('../prismaClient');

// Save chunks to PostgreSQL instead of ChromaDB
const addDocuments = async (courseId, documents) => {
  try {
    const chunks = documents.map(doc => ({
      id:            doc.id,
      materialId:    doc.metadata.materialId,
      materialTitle: doc.metadata.materialTitle,
      courseId:      courseId,
      text:          doc.text,
      embedding:     doc.embedding,
      chunkIndex:    parseInt(doc.metadata.chunkIndex || '0'),
      topic:         doc.metadata.topic || null,
      week:          doc.metadata.week || null,
    }));

    await prisma.materialChunk.createMany({
      data: chunks,
      skipDuplicates: true,
    });

    console.log(`✅ Stored ${chunks.length} chunks in PostgreSQL`);
  } catch (err) {
    console.error('Vector store error:', err);
    throw err;
  }
};

// Cosine similarity search in PostgreSQL
const searchDocuments = async (courseId, queryEmbedding, nResults = 3) => {
  try {
    // Get all chunks for this course
    const chunks = await prisma.materialChunk.findMany({
      where: { courseId }
    });

    if (chunks.length === 0) return [];

    // Calculate cosine similarity for each chunk
    const scored = chunks.map(chunk => {
      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
      return { chunk, similarity };
    });

    // Sort by similarity descending and return top N
    scored.sort((a, b) => b.similarity - a.similarity);
    const topN = scored.slice(0, nResults);

    return {
      documents: [topN.map(s => s.chunk.text)],
      metadatas: [topN.map(s => ({
        materialId:    s.chunk.materialId,
        materialTitle: s.chunk.materialTitle,
        courseId:      s.chunk.courseId,
        topic:         s.chunk.topic || '',
        week:          s.chunk.week || '',
        chunkIndex:    String(s.chunk.chunkIndex),
      }))],
      distances: [topN.map(s => 1 - s.similarity)],
    };
  } catch (err) {
    console.error('Vector search error:', err);
    return null;
  }
};

// Delete chunks when material is deleted
const deleteDocuments = async (materialId) => {
  try {
    await prisma.materialChunk.deleteMany({
      where: { materialId }
    });
    console.log(`✅ Deleted chunks for material ${materialId}`);
  } catch (err) {
    console.error('Delete chunks error:', err);
  }
};

// Cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot   += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

module.exports = { addDocuments, searchDocuments, deleteDocuments };