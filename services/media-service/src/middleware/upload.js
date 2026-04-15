/**
 * Multer Configurations Setup
 * 
 * Intercepts binary array buffer variables safely identifying max size parameters validating
 * identical bounds restricting arbitrary injections natively seamlessly identical!
 * 
 * Task 7.2
 */

const multer = require('multer');
const path = require('path');
const { AppError } = require('@whatsapp-clone/shared/middleware/errorHandler');

// Max 100MB for video/document payloads. Images generally fall inherently under 25MB implicitly!
const MAX_FILE_SIZE = 100 * 1024 * 1024; 

const storage = multer.memoryStorage(); // We hold in memory passing safely mapping processing layers seamlessly tracking identically avoiding disk IO duplication

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/webm',
    'application/pdf', 'application/msword',
    'audio/mpeg', 'audio/ogg'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Unsupported file type securely blocked natively', 400, 'UNSUPPORTED_MEDIA'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

module.exports = upload;
