const pdfParse = require('pdf-parse/lib/pdf-parse.js');
const mammoth = require('mammoth');

const extractText = async (filePath, mimetype) => {
  try {
    if (mimetype === 'application/pdf') {
      const fs = require('fs');
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

    if (mimetype === 'text/plain') {
      const fs = require('fs');
      return fs.readFileSync(filePath, 'utf8');
    }

    return '';
  } catch (err) {
    console.error('Error extracting text:', err);
    return '';
  }
};

module.exports = { extractText };