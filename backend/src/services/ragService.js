const { embed, chat } = require('./ollamaService');
const { addDocuments, searchDocuments } = require('./chromaService');
const { extractText } = require('./fileParser');

// ─── Chunk text into smaller pieces ──────────────────────────────────────────
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

// ─── Process material after upload ───────────────────────────────────────────
const processMaterial = async (material) => {
  try {
    console.log(`Processing material: ${material.title}`);

    const text = await extractText(material.filePath, material.type);
    if (!text || text.trim().length === 0) {
      console.log('No text extracted from file');
      return;
    }

    const chunks = chunkText(text, 500);
    console.log(`Created ${chunks.length} chunks`);

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

    if (documents.length > 0) {
      await addDocuments(material.courseId, documents);
      console.log(`✅ Stored ${documents.length} chunks for ${material.title}`);
    }
  } catch (err) {
    console.error('Error processing material:', err);
  }
};

// ─── Search for relevant material chunks ─────────────────────────────────────
const searchMaterials = async (question, courseId) => {
  try {
    const queryEmbedding = await embed(question);
    const results = await searchDocuments(courseId, queryEmbedding, 8); // ← bumped to 5 for more context

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

// ─── Core: Generate a grounded answer from retrieved context ─────────────────
const generateAnswer = async (question, courseId, hintMode = false, conversationHistory = []) => {
  try {
    // 1. Retrieve relevant chunks from vector DB
    const relevantChunks = await searchMaterials(question, courseId);

    // 2. If nothing relevant found, refuse immediately — don't let LLM guess
    if (relevantChunks.length === 0) {
      return {
        answer: "I could not find any relevant information in your course materials to answer this question. Please make sure the relevant material has been uploaded.",
        sources: [],
        grounded: false
      };
    }

    // 3. Check relevance quality — distance > 1.5 means the chunks are too far from the question
    const goodChunks = relevantChunks.filter(c => c.distance < 1.5);
    if (goodChunks.length === 0) {
      return {
        answer: "Your course materials don't appear to contain specific information on this topic. Try rephrasing your question or ask about a topic covered in the uploaded materials.",
        sources: [],
        grounded: false
      };
    }

    // 4. Build context string from retrieved chunks only
    const context = goodChunks
      .map((chunk, i) => `[Source ${i + 1}: ${chunk.metadata.materialTitle}]\n${chunk.text}`)
      .join('\n\n---\n\n');

    // 5. Get unique source names for display
    const sources = [...new Set(goodChunks.map(c => c.metadata.materialTitle))];

    // 6. Build a strict system prompt that forbids hallucination
    const systemPrompt = hintMode
      ? `You are a Socratic tutor for a university course. Your job is to guide students toward the answer using ONLY the course material provided below — never use outside knowledge.

STRICT RULES:
- ONLY use information from the COURSE CONTEXT section below.
- Do NOT add facts, examples, or explanations that are not explicitly stated in the context.
- If the context does not contain enough information to answer, say exactly: "The course materials don't cover this specific topic. Please refer to additional resources or ask your lecturer."
- Never make up examples. Never use general knowledge. Context only.
- Ask guiding questions to help the student think — do not give direct answers.
- If the student asks for something completely outside the material, say so clearly.

COURSE CONTEXT:
${context}`
      : `You are a precise AI tutor for a university course. You MUST answer using ONLY the course material provided below.

STRICT RULES — READ CAREFULLY:
- ONLY use information from the COURSE CONTEXT section below. Nothing else.
- Do NOT use your general training knowledge, even if you know the answer.
- Do NOT add examples, facts, or explanations that are not explicitly in the context.
- If the context does not contain enough information to answer the question fully, say exactly: "This topic is not fully covered in your uploaded course materials. I can only answer based on what has been provided."
- Never guess. Never hallucinate. If unsure, say you're unsure based on the material.
- Cite which source (e.g. "According to [Source 1]...") you are drawing from.
- Be concise and accurate.

COURSE CONTEXT:
${context}`;

    // 7. Build the messages array with conversation history for continuity
    const messages = [
      ...conversationHistory.slice(-6), // last 3 exchanges (6 messages) for context
      { role: 'user', content: question }
    ];

    // 8. Call the LLM with strict settings
    const answer = await chat(messages, systemPrompt);

    return {
      answer,
      sources,
      grounded: true
    };

  } catch (err) {
    console.error('Error generating answer:', err);
    return {
      answer: "An error occurred while generating a response. Please try again.",
      sources: [],
      grounded: false
    };
  }
};

module.exports = { processMaterial, searchMaterials, generateAnswer };