/**
 * Model Associations
 * 
 * Sets up relationships between AuthUser and RefreshToken.
 * Must be called after both models are loaded.
 */

const AuthUser = require('./AuthUser');
const RefreshToken = require('./RefreshToken');

// One user can have many refresh tokens (one per device)
AuthUser.hasMany(RefreshToken, {
  foreignKey: 'user_id',
  as: 'refreshTokens',
  onDelete: 'CASCADE',
});

RefreshToken.belongsTo(AuthUser, {
  foreignKey: 'user_id',
  as: 'user',
});

module.exports = { AuthUser, RefreshToken };
