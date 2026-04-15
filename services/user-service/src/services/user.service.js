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

    const { status_message, last_seen_privacy, profile_photo_privacy, status_privacy } = updateData;

    await profile.update({
      status_message: status_message !== undefined ? status_message : profile.status_message,
      last_seen_privacy: last_seen_privacy || profile.last_seen_privacy,
      profile_photo_privacy: profile_photo_privacy || profile.profile_photo_privacy,
      status_privacy: status_privacy || profile.status_privacy,
    });

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
