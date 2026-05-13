const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const extractText = async (filePath, mimetype) => {
  try {
    if (mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    }

    if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }

    // For text files
    if (mimetype === 'text/plain') {
      return fs.readFileSync(filePath, 'utf8');
    }

    return '';
  } catch (err) {
    console.error('Error extracting text:', err);
    return '';
  }
};

module.exports = { extractText };