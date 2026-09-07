// ============================================================
// fileParser.js — Extract Text from PDF, Word, Plain Text
// ============================================================
// Supports BOTH pdf-parse v1 (function API) and v2 (PDFParse class API)
// ============================================================

const fs = require('fs');
const path = require('path');

// PDF extraction — auto-detects pdf-parse v1 vs v2
const extractPDF = async (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const pdfModule = require('pdf-parse');

  // ---- pdf-parse v2.x: class-based API ----
  const PDFParse = pdfModule.PDFParse || (pdfModule.default && pdfModule.default.PDFParse);

  if (typeof PDFParse === 'function') {
    let parser;
    try {
      parser = new PDFParse({ data: fileBuffer });
      const result = await parser.getText();
      const text = result.text || '';
      const pages = result.total || result.numpages || 'unknown';
      console.log(`✅ Extracted text from PDF (v2 API): ${pages} pages, ${text.length} chars`);
      return text;
    } catch (err) {
      console.error('❌ PDF extraction error (v2 API):', err.message);
      throw new Error(`Failed to extract PDF: ${err.message}`);
    } finally {
      if (parser && typeof parser.destroy === 'function') {
        try { await parser.destroy(); } catch (_) { /* ignore cleanup errors */ }
      }
    }
  }

  // ---- pdf-parse v1.x: plain function API ----
  const pdfParse = typeof pdfModule === 'function'
    ? pdfModule
    : (typeof pdfModule.default === 'function' ? pdfModule.default : null);

  if (typeof pdfParse === 'function') {
    try {
      const data = await pdfParse(fileBuffer);
      const text = data.text || '';
      console.log(`✅ Extracted text from PDF (v1 API): ${data.numpages} pages, ${text.length} chars`);
      return text;
    } catch (err) {
      console.error('❌ PDF extraction error (v1 API):', err.message);
      throw new Error(`Failed to extract PDF: ${err.message}`);
    }
  }

  // ---- Neither API found ----
  console.error('❌ pdf-parse module shape not recognised. Exports:', Object.keys(pdfModule));
  throw new Error('Failed to extract PDF: pdf-parse exports neither a PDFParse class nor a callable parser');
};

// Word document extraction
const extractWord = async (filePath) => {
  try {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    console.log(`✅ Extracted text from Word document: ${result.value.length} chars`);
    return result.value;
  } catch (err) {
    console.error('❌ Word extraction error:', err.message);
    throw new Error(`Failed to extract Word: ${err.message}`);
  }
};

// Main dispatcher
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
      console.log(`✅ Extracted text from plain text file: ${text.length} chars`);
      return text;
    }

    throw new Error(`Unsupported file type: ${mimeType}`);
  } catch (err) {
    console.error('❌ File extraction error:', err.message);
    throw err;
  }
};

module.exports = { extractText, extractPDF, extractWord };