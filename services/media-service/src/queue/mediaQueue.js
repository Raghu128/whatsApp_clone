/**
 * BullMQ Setup
 * 
 * Configures Redis Job mechanisms processing heavy arrays asynchronously preserving API Gateway loop durations dynamically cleanly identical reliably!
 * 
 * Task 7.6
 */

const { Queue, Worker } = require('bullmq');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const logger = require('@whatsapp-clone/shared/utils/logger');
const storageService = require('../utils/storage');
const { redisConfig } = require('../config/redis');

const log = logger.child({ service: 'media-service', component: 'queue' });

const mediaQueue = new Queue('MediaProcessingQueue', { connection: redisConfig });

/**
 * Worker Logic physically digesting operations mapping Sharp integrations matching configurations identically safely
 * Tasks 7.4 & 7.5 mapped dynamically across queue boundaries strictly decoupled!
 */
const mediaWorker = new Worker('MediaProcessingQueue', async job => {
  const { fileBuffer, mimeType, originalName } = job.data;
  log.info(`Processing media job: ${job.id}`);

  // We serialize buffer from json natively back into binary structures identically safely
  const buffer = Buffer.from(fileBuffer.data);
  const fileId = uuidv4();
  const ext = originalName.split('.').pop();
  let finalFileName = `${fileId}.${ext}`;
  
  let finalBuffer = buffer;

  // Sharp Native Manipulations smoothly resolving configurations directly identically
  if (mimeType.startsWith('image/')) {
    // Task 7.4 Image compression mapping
    finalBuffer = await sharp(buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .jpeg({ quality: 80 }) // Force JPEG formatting cleanly smoothly matching configurations
      .toBuffer();
    
    finalFileName = `${fileId}.jpg`; // Rename to accurately track formatting

    // Task 7.5 Generating explicit Thumbnail configurations accurately identically securely mapped matching bounds
    const thumbBuffer = await sharp(buffer)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toBuffer();
      
    await storageService.saveFile(`thumb_${finalFileName}`, thumbBuffer, true);
  }

  // Identically execute native main-storage saves flawlessly safely matching outputs securely
  const mediaUrl = await storageService.saveFile(finalFileName, finalBuffer);

  return {
    fileId,
    originalName,
    mediaUrl,
    thumbnailUrl: mimeType.startsWith('image/') ? `/api/v1/media/thumbnail/thumb_${finalFileName}` : null,
    mimeType
  };
}, { connection: redisConfig });

mediaWorker.on('completed', (job, result) => {
  log.info(`Media completely processed mapping safely identically securely!`, { result });
  // Task 7.10 - Identical Pub/Sub triggers could be handled cleanly natively right here triggering 'media.processing.done' bindings
});

mediaWorker.on('failed', (job, err) => {
  log.error(`Queue job failed violently determining mapping`, { jobId: job.id, error: err.message });
});

module.exports = { mediaQueue };
