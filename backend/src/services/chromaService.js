const { ChromaClient } = require('chromadb');

const client = new ChromaClient({
  path: process.env.CHROMA_URL || 'http://localhost:8000'
});

const getCollection = async (courseId) => {
  const collectionName = `course_${courseId.replace(/-/g, '_')}`;
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

const searchDocuments = async (courseId, queryEmbedding, nResults = 4) => {
  try {
    const collection = await getCollection(courseId);
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults
    });
    return results;
  } catch (err) {
    console.error('ChromaDB search error:', err);
    return null;
  }
};

module.exports = { getCollection, addDocuments, searchDocuments };