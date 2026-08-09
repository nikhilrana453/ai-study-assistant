// backend/src/services/guardrails.js
//
// Lightweight guardrails for the chat route. These were referenced in chat.js
// but never implemented, which crashed the streaming endpoint
// ("checkInputSafety is not defined"). They're intentionally permissive: the
// RAG retrieval + the tutor's system prompt already keep answers grounded in
// course material, so these mainly reject empty/oversized/abusive input rather
// than second-guessing legitimate study questions.
 
// Guardrail 1 — basic input safety.
// Returns { safe: boolean, reason: string }.
const checkInputSafety = (question) => {
  if (typeof question !== 'string' || question.trim().length === 0) {
    return { safe: false, reason: 'Please enter a question.' };
  }
 
  if (question.length > 4000) {
    return {
      safe: false,
      reason: 'That question is too long. Please shorten it and try again.',
    };
  }
 
  // Narrow prompt-injection guard. Deliberately NOT blocking topic words like
  // "attack", "exploit", "bomb", "kill" etc. — those are legitimate in a
  // security course (e.g. "fork bomb", "cyber kill chain").
  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
    /disregard\s+(the\s+)?system\s+prompt/i,
  ];
  if (injectionPatterns.some((p) => p.test(question))) {
    return {
      safe: false,
      reason: 'Please ask a question about your course material.',
    };
  }
 
  return { safe: true, reason: '' };
};
 
// Guardrail 2 — scope check.
// Returns { inScope: boolean, reason: string }.
// Permissive by design: the system prompt already replies "beyond the scope of
// this course" when no relevant material is found, so we let questions through
// and let retrieval decide. Tighten this later if you want a hard scope gate.
const checkScope = (question) => {
  return { inScope: true, reason: '' };
};
 
module.exports = { checkInputSafety, checkScope };