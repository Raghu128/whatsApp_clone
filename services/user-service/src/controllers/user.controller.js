/**
 * User REST Controller
 */

const { success } = require('@whatsapp-clone/shared/utils/responseFormatter');
const userService = require('../services/user.service');
const contactService = require('../services/contact.service');
const logger = require('@whatsapp-clone/shared/utils/logger');

const userController = {
  // Profiles
  async getProfile(req, res, next) {
    try {
      const profile = await userService.getProfile(req.headers['x-user-id']);
      return success(res, profile, 'Profile retrieved');
    } catch (err) { next(err); }
  },

  async getUser(req, res, next) {
    try {
      const profile = await userService.getProfile(req.params.id);
      return success(res, profile, 'User retrieved');
    } catch (err) { next(err); }
  },

  async updateProfile(req, res, next) {
    try {
      const profile = await userService.updateProfile(req.headers['x-user-id'], req.body);
      return success(res, profile, 'Profile updated');
    } catch (err) { next(err); }
  },

  async searchUsers(req, res, next) {
    try {
      const users = await userService.searchUsers(req.query.q, req.headers['x-user-id']);
      return success(res, users, 'Users retrieved');
    } catch (err) { next(err); }
  },

  async uploadAvatar(req, res, next) {
    try {
      // Assuming a simplistic mocked intercept structure where middleware attaches file path URL
      // In reality, Media Service handles true binaries. We represent the DB mapping here string-wise.
      const avatarUrl = req.body.avatar_url; 
      const profile = await userService.uploadAvatar(req.headers['x-user-id'], avatarUrl);
      return success(res, profile, 'Avatar updated');
    } catch (err) { next(err); }
  },

  // Contacts
  async getContacts(req, res, next) {
    try {
      const contacts = await contactService.getContacts(req.headers['x-user-id']);
      return success(res, contacts, 'Contacts retrieved');
    } catch (err) { next(err); }
  },

  async addContact(req, res, next) {
    try {
      const { targetPhone, customName } = req.body;
      const contact = await contactService.addContact(req.headers['x-user-id'], targetPhone, customName);
      return success(res, contact, 'Contact added', 201);
    } catch (err) { next(err); }
  },

  async removeContact(req, res, next) {
    try {
      await contactService.removeContact(req.headers['x-user-id'], req.params.id);
      return success(res, null, 'Contact removed');
    } catch (err) { next(err); }
  },

  async blockContact(req, res, next) {
    try {
      const contact = await contactService.blockContact(req.headers['x-user-id'], req.params.id);
      return success(res, contact, 'Contact blocked');
    } catch (err) { next(err); }
  }
};

module.exports = userController;
