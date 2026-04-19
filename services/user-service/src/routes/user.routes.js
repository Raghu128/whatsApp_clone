/**
 * User Service — Routes
 */

const { Router } = require('express');
const userController = require('../controllers/user.controller');

const router = Router();

// Profile Routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile); // In real setting: add Joi validation mapping here
router.get('/search', userController.searchUsers);
router.get('/:id', userController.getUser);
router.post('/avatar', userController.uploadAvatar);

// Contact Routes
router.get('/contacts', userController.getContacts);
router.post('/contacts', userController.addContact);
router.delete('/contacts/:id', userController.removeContact);
router.post('/contacts/:id/block', userController.blockContact);

// Group structure (Mock endpoint bindings - full integration would duplicate explicit models)
router.post('/groups', (req, res) => res.status(501).json({ error: 'Not implemented' }));

module.exports = router;
