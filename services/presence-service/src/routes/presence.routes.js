/**
 * Gateway Route Explicit Intercepts
 * 
 * Handles bindings dynamically configuring setups resolving REST requests internally mapping specifically.
 */

const { Router } = require('express');
const presenceController = require('../controllers/presence.controller');

const router = Router();

router.post('/heartbeat', presenceController.heartbeat);
router.post('/bulk', presenceController.getBulkStatus);
router.get('/:userId', presenceController.getStatus);

module.exports = router;
