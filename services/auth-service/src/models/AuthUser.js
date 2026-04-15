/**
 * Auth User Model (Sequelize)
 * 
 * PostgreSQL table: auth_users
 * Stores ONLY authentication credentials — no profile data.
 * Profile data lives in User Service (user_profiles table).
 * 
 * Schema matches ARCHITECTURE.md specification.
 */

const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');
const config = require('../config/env');

class AuthUser extends Model {
  /**
   * Compare a plaintext password against the stored hash.
   * @param {string} password - Plaintext password to check
   * @returns {Promise<boolean>} True if password matches
   */
  async comparePassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }

  /**
   * Return a sanitized version of the user (no password hash).
   */
  toSafeJSON() {
    const { password_hash, ...safeUser } = this.toJSON();
    return safeUser;
  }
}

AuthUser.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: {
        msg: 'Phone number is already registered',
      },
      validate: {
        notEmpty: { msg: 'Phone number cannot be empty' },
        is: {
          args: /^\+?[1-9]\d{6,14}$/,
          msg: 'Please provide a valid phone number',
        },
      },
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        msg: 'Username is already taken',
      },
      validate: {
        notEmpty: { msg: 'Username cannot be empty' },
        len: {
          args: [3, 50],
          msg: 'Username must be between 3 and 50 characters',
        },
        is: {
          args: /^[a-zA-Z0-9_]+$/,
          msg: 'Username can only contain letters, numbers, and underscores',
        },
      },
    },
    email: {
      type: DataTypes.STRING(100),
      unique: {
        msg: 'Email is already registered',
      },
      validate: {
        isEmail: { msg: 'Please provide a valid email address' },
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'AuthUser',
    tableName: 'auth_users',
    timestamps: true,
    underscored: true,
    hooks: {
      /**
       * Hash password before saving.
       * Uses bcrypt with 12 salt rounds (Task 2.8).
       */
      beforeCreate: async (user) => {
        if (user.password_hash) {
          user.password_hash = await bcrypt.hash(
            user.password_hash,
            config.BCRYPT_SALT_ROUNDS || 12
          );
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password_hash')) {
          user.password_hash = await bcrypt.hash(
            user.password_hash,
            config.BCRYPT_SALT_ROUNDS || 12
          );
        }
      },
    },
  }
);

module.exports = AuthUser;
