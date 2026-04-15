/**
 * User Profile Model (Sequelize)
 * 
 * Primary table generated immediately upon user registration event.
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class UserProfile extends Model {
  toSafeJSON() {
    return this.toJSON();
  }
}

UserProfile.init(
  {
    user_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      comment: 'Matches the exact UUID from auth_users',
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
    },
    avatar_url: {
      type: DataTypes.STRING(255),
    },
    status_message: {
      type: DataTypes.STRING(139),
      defaultValue: 'Hey there! I am using WhatsApp Clone.',
    },
    last_seen_privacy: {
      type: DataTypes.ENUM('everyone', 'contacts', 'nobody'),
      defaultValue: 'everyone',
    },
    profile_photo_privacy: {
      type: DataTypes.ENUM('everyone', 'contacts', 'nobody'),
      defaultValue: 'everyone',
    },
    status_privacy: {
      type: DataTypes.ENUM('everyone', 'contacts', 'nobody'),
      defaultValue: 'everyone',
    },
  },
  {
    sequelize,
    modelName: 'UserProfile',
    tableName: 'user_profiles',
    timestamps: true,
    underscored: true,
  }
);

module.exports = UserProfile;
