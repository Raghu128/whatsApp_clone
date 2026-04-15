/**
 * Model Associations
 */

const UserProfile = require('./UserProfile');
const Contact = require('./Contact');
const Group = require('./Group');
const GroupMember = require('./GroupMember');

// Base Profile References
UserProfile.hasMany(Contact, { foreignKey: 'owner_id', as: 'contacts' });
Contact.belongsTo(UserProfile, { foreignKey: 'contact_id', as: 'contactDetails' });

// Group References
Group.belongsTo(UserProfile, { foreignKey: 'creator_id', as: 'creator' });
UserProfile.hasMany(Group, { foreignKey: 'creator_id' });

// Group Member References (Many to Many through GroupMember)
Group.belongsToMany(UserProfile, {
  through: GroupMember,
  foreignKey: 'group_id',
  otherKey: 'user_id',
  as: 'members'
});
UserProfile.belongsToMany(Group, {
  through: GroupMember,
  foreignKey: 'user_id',
  otherKey: 'group_id',
  as: 'userGroups'
});

module.exports = {
  UserProfile,
  Contact,
  Group,
  GroupMember,
};
