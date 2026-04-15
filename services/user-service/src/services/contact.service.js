/**
 * Contact Service (Business Logic)
 */

const { AppError } = require('@whatsapp-clone/shared/middleware/errorHandler');
const { Contact, UserProfile } = require('../models');

class ContactService {
  async getContacts(userId) {
    // Return all contacts along with their profile details
    const contacts = await Contact.findAll({
      where: { owner_id: userId },
      include: [{
        model: UserProfile,
        as: 'contactDetails',
        attributes: ['username', 'phone', 'avatar_url', 'status_message']
      }]
    });
    return contacts;
  }

  async addContact(ownerId, targetPhone, customName) {
    // Locate target using the global UserProfile constraints dynamically
    const targetProfile = await UserProfile.findOne({ where: { phone: targetPhone } });
    if (!targetProfile) {
      throw new AppError('Phone number not found in system', 404, 'USER_NOT_FOUND');
    }

    if (targetProfile.user_id === ownerId) {
      throw new AppError('Cannot add yourself as a contact', 400, 'INVALID_CONTACT');
    }

    const existing = await Contact.findOne({
      where: { owner_id: ownerId, contact_id: targetProfile.user_id }
    });

    if (existing) {
      throw new AppError('Contact already exists', 409, 'CONTACT_EXISTS');
    }

    const newContact = await Contact.create({
      owner_id: ownerId,
      contact_id: targetProfile.user_id,
      custom_name: customName || targetProfile.username,
    });

    return newContact;
  }

  async removeContact(ownerId, contactId) {
    const deleted = await Contact.destroy({
      where: { owner_id: ownerId, contact_id: contactId }
    });

    if (deleted === 0) {
      throw new AppError('Contact not found', 404, 'NOT_FOUND');
    }
  }

  async blockContact(ownerId, contactId) {
    const contact = await Contact.findOne({
      where: { owner_id: ownerId, contact_id: contactId }
    });

    if (!contact) {
      throw new AppError('Contact not found', 404, 'NOT_FOUND');
    }

    await contact.update({ is_blocked: true });
    return contact;
  }
}

module.exports = new ContactService();
