const { embed } = require('./ollamaService');
const { addDocuments, searchDocuments } = require('./chromaService');
const { extractText } = require('./fileParser');

// Chunk text into smaller pieces
const chunkText = (text, chunkSize = 500) => {
  const words = text.split(' ');
  const chunks = [];
  let current = [];

  for (const word of words) {
    current.push(word);
    if (current.length >= chunkSize) {
      chunks.push(current.join(' '));
      current = [];
    }
  }

  if (current.length > 0) {
    chunks.push(current.join(' '));
  }

  return chunks;
};

// Process material after upload
const processMaterial = async (material) => {
  try {
    console.log(`Processing material: ${material.title}`);

    // Extract text from file
    const text = await extractText(material.filePath, material.type);
    if (!text || text.trim().length === 0) {
      console.log('No text extracted from file');
      return;
    }

    // Split into chunks
    const chunks = chunkText(text, 500);
    console.log(`Created ${chunks.length} chunks`);

    // Embed each chunk and prepare documents
    const documents = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk.trim().length < 10) continue;

      const embedding = await embed(chunk);
      documents.push({
        id: `${material.id}_chunk_${i}`,
        text: chunk,
        embedding,
        metadata: {
          materialId: material.id,
          materialTitle: material.title,
          courseId: material.courseId,
          topic: material.topic || '',
          week: material.week ? String(material.week) : '',
          chunkIndex: String(i)
        }
      });
    }

    // Store in ChromaDB
    if (documents.length > 0) {
      await addDocuments(material.courseId, documents);
      console.log(`✅ Stored ${documents.length} chunks for ${material.title}`);
    }
  } catch (err) {
    console.error('Error processing material:', err);
  }
};

// Search for relevant materials
const searchMaterials = async (question, courseId) => {
  try {
    const queryEmbedding = await embed(question);
    const results = await searchDocuments(courseId, queryEmbedding, 4);

    if (!results || !results.documents || results.documents[0].length === 0) {
      return [];
    }

    return results.documents[0].map((doc, i) => ({
      text: doc,
      metadata: results.metadatas[0][i],
      distance: results.distances[0][i]
    }));
  } catch (err) {
    console.error('Error searching materials:', err);
    return [];
  }
};

module.exports = { processMaterial, searchMaterials };