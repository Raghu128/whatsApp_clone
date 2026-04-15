/**
 * Refresh Token Model (Sequelize)
 * 
 * PostgreSQL table: refresh_tokens
 * Stores hashed refresh tokens with device info and expiry.
 * Supports multiple devices per user.
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class RefreshToken extends Model {}

RefreshToken.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'auth_users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    device_info: {
      type: DataTypes.STRING(500),
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'RefreshToken',
    tableName: 'refresh_tokens',
    timestamps: true,
    underscored: true,
    updatedAt: false, // Refresh tokens are immutable — only created and deleted
    indexes: [
      {
        fields: ['user_id'],
        name: 'idx_refresh_tokens_user',
      },
      {
        fields: ['token_hash'],
        name: 'idx_refresh_tokens_hash',
      },
      {
        fields: ['expires_at'],
        name: 'idx_refresh_tokens_expiry',
      },
    ],
  }
);

module.exports = RefreshToken;
