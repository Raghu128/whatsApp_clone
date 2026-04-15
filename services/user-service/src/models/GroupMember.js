/**
 * Group Member (Sequelize)
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class GroupMember extends Model {}

GroupMember.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    group_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'groups',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'user_profiles',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
    },
    role: {
      type: DataTypes.ENUM('admin', 'member'),
      defaultValue: 'member',
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'GroupMember',
    tableName: 'group_members',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['group_id', 'user_id'],
        name: 'idx_unique_group_member',
      },
    ],
  }
);

module.exports = GroupMember;
