const { ChromaClient } = require('chromadb');

const client = new ChromaClient({
  path: process.env.CHROMA_URL || 'http://localhost:8000'
});

// ─── Sanitise courseId for ChromaDB collection naming ────────────────────────
// ChromaDB collection names: only alphanumeric + underscores, 3-63 chars
const toCollectionName = (courseId) => {
  const sanitised = `course_${courseId}`
    .replace(/[^a-zA-Z0-9_]/g, '_')  // replace any non-alphanumeric with _
    .replace(/__+/g, '_')             // collapse multiple underscores
    .substring(0, 63);               // max 63 chars
  return sanitised;
};

const getCollection = async (courseId) => {
  const collectionName = toCollectionName(courseId);
  try {
    return await client.getOrCreateCollection({
      name: collectionName,
      metadata: { courseId }
    });
  } catch (err) {
    console.error('ChromaDB error:', err);
    throw err;
  }
};

const addDocuments = async (courseId, documents) => {
  const collection = await getCollection(courseId);
  await collection.add({
    ids: documents.map(d => d.id),
    documents: documents.map(d => d.text),
    metadatas: documents.map(d => d.metadata),
    embeddings: documents.map(d => d.embedding)
  });
};

const searchDocuments = async (courseId, queryEmbedding, nResults = 5) => {
  try {
    const collection = await getCollection(courseId);

    // Check how many docs exist before searching
    const count = await collection.count();
    console.log(`ChromaDB: collection "${toCollectionName(courseId)}" has ${count} documents`);

    if (count === 0) {
      console.log('ChromaDB: collection is empty — PDF may not have been processed');
      return null;
    }

    // Don't request more results than documents exist
    const safeN = Math.min(nResults, count);

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: safeN
    });

    // Log distances so we can tune the threshold
    if (results?.distances?.[0]) {
      console.log('ChromaDB distances:', results.distances[0]);
    }

    return results;
  } catch (err) {
    console.error('ChromaDB search error:', err);
    return null;
  }
};

// ─── Delete all chunks for a course (call before re-uploading material) ───────
const clearCollection = async (courseId) => {
  try {
    const collectionName = toCollectionName(courseId);
    await client.deleteCollection({ name: collectionName });
    console.log(`✅ Cleared ChromaDB collection: ${collectionName}`);
  } catch (err) {
    console.error('Error clearing collection:', err.message);
  }
};

// ─── Delete chunks for a specific material only ───────────────────────────────
const deleteDocumentsByMaterial = async (courseId, materialId) => {
  try {
    const collection = await getCollection(courseId);
    await collection.delete({
      where: { materialId }
    });
    console.log(`✅ Deleted chunks for material: ${materialId}`);
  } catch (err) {
    console.error('Error deleting material chunks:', err.message);
  }
};

module.exports = {
  getCollection,
  addDocuments,
  searchDocuments,
  clearCollection,
  deleteDocumentsByMaterial
};