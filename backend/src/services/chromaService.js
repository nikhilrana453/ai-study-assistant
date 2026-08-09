const { addDocuments, searchDocuments } = require('./vectorService');

const getCollection = async (courseId) => {
  return { courseId };
};

module.exports = { getCollection, addDocuments, searchDocuments };