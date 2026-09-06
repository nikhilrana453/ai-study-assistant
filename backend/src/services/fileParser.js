// ============================================================
// fileParser.js — Extract Text from PDF, Word, Plain Text
// ============================================================

const fs = require('fs');
const path = require('path');

// PDF extraction using pdf-parse
const extractPDF = async (filePath) => {
  try {
    const pdfParse = require('pdf-parse/lib/pdf.js');
    const fileBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(fileBuffer);

    // Extract text from all pages
    let fullText = '';
    for (let i = 0; i < data.numpages; i++) {
      fullText += `--- PAGE ${i + 1} ---\n`;
      fullText += data.text || '';
      fullText += '\n';
    }

    console.log(`✅ Extracted text from PDF: ${data.numpages} pages`);
    return fullText;
  } catch (err) {
    console.error('❌ PDF extraction error:', err.message);
    throw new Error(`Failed to extract PDF: ${err.message}`);
  }
};

// Word document extraction
const extractWord = async (filePath) => {
  try {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    console.log(`✅ Extracted text from Word document`);
    return result.value;
  } catch (err) {
    console.error('❌ Word extraction error:', err.message);
    throw new Error(`Failed to extract Word: ${err.message}`);
  }
};

// Plain text extraction
const extractText = async (filePath, mimeType) => {
  try {
    const ext = path.extname(filePath).toLowerCase();

    console.log(`📄 Extracting from ${ext} (${mimeType})`);

    if (mimeType === 'application/pdf' || ext === '.pdf') {
      return await extractPDF(filePath);
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword' ||
      ext === '.docx' ||
      ext === '.doc'
    ) {
      return await extractWord(filePath);
    }

    if (mimeType === 'text/plain' || ext === '.txt') {
      const text = fs.readFileSync(filePath, 'utf-8');
      console.log(`✅ Extracted text from plain text file`);
      return text;
    }

    throw new Error(`Unsupported file type: ${mimeType}`);
  } catch (err) {
    console.error('❌ File extraction error:', err.message);
    throw err;
  }
};

module.exports = { extractText, extractPDF, extractWord };