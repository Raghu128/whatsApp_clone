/**
 * Media Service routes cleanly encapsulating express arrays dynamically structurally seamlessly.
 */

const { Router } = require('express');
const mediaController = require('../controllers/media.controller');
const upload = require('../middleware/upload');

const router = Router();

router.post('/upload', upload.single('file'), mediaController.uploadMedia);
router.get('/:id', mediaController.getMedia);
router.get('/thumbnail/:id', mediaController.getThumbnail);

module.exports = router;
