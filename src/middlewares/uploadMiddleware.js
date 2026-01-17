const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadSingle = (fieldName) => upload.single(fieldName);
const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
};
