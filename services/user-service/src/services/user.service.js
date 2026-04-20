/**
 * User Service (Business Logic)
 */

const { AppError } = require('@whatsapp-clone/shared/middleware/errorHandler');
const { UserProfile } = require('../models');
const { Op } = require('sequelize');

class UserService {
  async getProfile(userId) {
    const profile = await UserProfile.findByPk(userId);
    if (!profile) {
      throw new AppError('Profile not found', 404, 'NOT_FOUND');
    }
    return profile.toSafeJSON();
  }

  async updateProfile(userId, updateData) {
    const profile = await UserProfile.findByPk(userId);
    if (!profile) {
      throw new AppError('Profile not found', 404, 'NOT_FOUND');
    }

    const { username, about, status_message, last_seen_privacy, profile_photo_privacy, status_privacy } = updateData;

    // Accept 'about' from frontend as alias for 'status_message'
    const newStatusMessage = about || status_message;

    const updates = {};
    if (username !== undefined) updates.username = username;
    if (newStatusMessage !== undefined) updates.status_message = newStatusMessage;
    if (last_seen_privacy) updates.last_seen_privacy = last_seen_privacy;
    if (profile_photo_privacy) updates.profile_photo_privacy = profile_photo_privacy;
    if (status_privacy) updates.status_privacy = status_privacy;

    await profile.update(updates);

    return profile.toSafeJSON();
  }

  async uploadAvatar(userId, avatarUrl) {
    const profile = await UserProfile.findByPk(userId);
    if (!profile) throw new AppError('Profile not found', 404, 'NOT_FOUND');

    await profile.update({ avatar_url: avatarUrl });
    return profile.toSafeJSON();
  }

  async searchUsers(query, currentUserId) {
    if (!query) return [];

    const users = await UserProfile.findAll({
      where: {
        user_id: { [Op.ne]: currentUserId },
        [Op.or]: [
          { username: { [Op.iLike]: `%${query}%` } },
          { phone: { [Op.iLike]: `%${query}%` } }
        ]
      },
      limit: 20,
      attributes: ['user_id', 'username', 'phone', 'avatar_url', 'status_message']
    });

    return users.map(u => u.toSafeJSON());
  }
}

module.exports = new UserService();
