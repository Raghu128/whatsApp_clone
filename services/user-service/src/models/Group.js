/**
 * Group Model (Sequelize)
 * 
 * Defines core messaging groups.
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Group extends Model {}

Group.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(500),
    },
    avatar_url: {
      type: DataTypes.STRING(255),
    },
    creator_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'user_profiles',
        key: 'user_id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Group',
    tableName: 'groups',
    timestamps: true,
    underscored: true,
  }
);

module.exports = Group;
