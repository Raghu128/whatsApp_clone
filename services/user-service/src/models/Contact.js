/**
 * Contact Model (Sequelize)
 * 
 * Stores relationships between standard users acting as traditional address-book records.
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Contact extends Model {}

Contact.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    owner_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'ID of the user who owns this contact list',
      references: {
        model: 'user_profiles',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
    },
    contact_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'ID of the target user',
      references: {
        model: 'user_profiles',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
    },
    custom_name: {
      type: DataTypes.STRING(50),
      comment: 'Optional user-defined name overriding standard username',
    },
    is_blocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Contact',
    tableName: 'contacts',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['owner_id', 'contact_id'], // A user can only have a given user in their contacts once
        name: 'idx_unique_contact',
      },
    ],
  }
);

module.exports = Contact;
