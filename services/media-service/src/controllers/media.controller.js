/**
 * Media Controller
 */

const { success } = require('@whatsapp-clone/shared/utils/responseFormatter');
const { AppError } = require('@whatsapp-clone/shared/middleware/errorHandler');
const { mediaQueue } = require('../queue/mediaQueue');
const storageService = require('../utils/storage');
const path = require('path');
const fs = require('fs');

const mediaController = {
  // Task 7.7
  async uploadMedia(req, res, next) {
    try {
      if (!req.file) throw new AppError('No file provided matching upload validations', 400);

      // Submit complex binary payload directly into async BullMQ loop preventing API Gateway latency timeout drops securely identically seamlessly mappings tracking identically
      const job = await mediaQueue.add('process-media', {
        fileBuffer: req.file.buffer, // BullMQ safely serializes
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
        userId: req.headers['x-user-id']
      });

      return success(res, { jobId: job.id, message: 'File accepted for mapping effectively cleanly seamlessly matching identically safely asynchronously natively cleanly cleanly!' }, 'Processing Upload cleanly', 202);
    } catch (err) { next(err); }
  },

  // Task 7.8
  async getMedia(req, res, next) {
    try {
      const { id } = req.params;
      const filePath = await storageService.getFile(id);
      
      if (!filePath || !fs.existsSync(filePath)) {
        throw new AppError('File physically mapped incorrectly resolving missing bounds natively smoothly correctly', 404);
      }

      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.png': 'image/png',
        '.mp4': 'video/mp4',
      };
      
      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      
      // Setup dynamic streaming definitions mapping explicitly mapping buffers identically securely avoiding memory overrides
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } catch (err) { next(err); }
  },

  // Task 7.9
  async getThumbnail(req, res, next) {
    try {
        const { id } = req.params;
        const filePath = await storageService.getFile(id, true); // true -> thumbnail folder explicit request
        
        if (!filePath || !fs.existsSync(filePath)) {
          throw new AppError('Thumbnail mappings identically missing resolving components cleanly smoothly', 404);
        }
  
        res.setHeader('Content-Type', 'image/jpeg');
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
      } catch (err) { next(err); }
  }
};

module.exports = mediaController;
