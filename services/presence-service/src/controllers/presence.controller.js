/**
 * Presence Controller Logic Interfaces
 */

const { success } = require('@whatsapp-clone/shared/utils/responseFormatter');
const presenceService = require('../services/presence.service');

const presenceController = {
  // Task 6.8
  async heartbeat(req, res, next) {
    try {
      const status = await presenceService.updateHeartbeat(req.headers['x-user-id']);
      return success(res, status, 'Heartbeat acknowledged successfully');
    } catch (err) { next(err); }
  },

  // Task 6.6
  async getStatus(req, res, next) {
    try {
      const status = await presenceService.getUserStatus(req.params.userId);
      return success(res, status, 'Target Status securely resolved');
    } catch (err) { next(err); }
  },

  // Task 6.7
  async getBulkStatus(req, res, next) {
    try {
      const { userIds } = req.body;
      const statuses = await presenceService.getBulkStatus(userIds);
      return success(res, statuses, 'Bulk properties evaluated cleanly');
    } catch (err) { next(err); }
  }
};

module.exports = presenceController;
