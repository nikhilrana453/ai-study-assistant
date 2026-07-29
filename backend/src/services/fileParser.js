const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// ─── Extract text from uploaded files ────────────────────────────────────────
const extractText = async (filePath, mimetype) => {
  try {
    if (mimetype === 'application/pdf') {
      return await extractPdfText(filePath);
    }

    if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }

    if (mimetype === 'text/plain') {
      return fs.readFileSync(filePath, 'utf8');
    }

    return '';
  } catch (err) {
    console.error('Error extracting text:', err);
    return '';
  }
};

// ─── PDF extraction with slide-deck awareness ─────────────────────────────────
// Problem: pdf-parse drops most text from PowerPoint-exported PDFs because
// slide text is stored as positioned text fragments, not flowing paragraphs.
// Fix: render each page separately and join all fragments explicitly.
const extractPdfText = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);

  // Collect ALL text items across every page
  const allPageTexts = [];

  const options = {
    // This callback fires for every page — we collect text here
    pagerender: async (pageData) => {
      try {
        const textContent = await pageData.getTextContent();
        
        // Each item.str is a text fragment — join them all
        const pageText = textContent.items
          .map(item => item.str)
          .filter(str => str && str.trim().length > 0)
          .join(' ');

        if (pageText.trim().length > 0) {
          allPageTexts.push(pageText);
        }

        // Return empty string — we handle collection ourselves
        return '';
      } catch (err) {
        return '';
      }
    }
  };

  try {
    await pdfParse(dataBuffer, options);
  } catch (err) {
    // pdf-parse sometimes throws even on success — ignore and use what we collected
    console.log('pdf-parse note:', err.message);
  }

  // If pagerender collected text, use it
  if (allPageTexts.length > 0) {
    const combined = allPageTexts.join('\n\n');
    console.log(`PDF extracted ${combined.length} characters across ${allPageTexts.length} pages`);
    return combined;
  }

  // Fallback: basic extraction (works for normal text PDFs)
  console.log('Falling back to basic pdf-parse extraction');
  const basic = await pdfParse(dataBuffer);
  console.log(`Basic extraction got ${basic.text.length} characters`);
  return basic.text;
};

module.exports = { extractText };