/**
 * AES-256-GCM Encryption Utility
 * 
 * Used for encrypting messages at rest in MongoDB.
 * Provides authenticated encryption — any tampering is detected.
 * 
 * Usage:
 *   const { encrypt, decrypt } = require('@whatsapp-clone/shared');
 *   const encrypted = encrypt('Hello world');
 *   const decrypted = decrypt(encrypted); // 'Hello world'
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;     // 128-bit IV for GCM
const TAG_LENGTH = 16;    // 128-bit auth tag
const ENCODING = 'hex';

/**
 * Get the encryption key from environment.
 * Key must be exactly 32 bytes (64 hex characters).
 */
function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  // Support both hex-encoded keys and raw strings
  if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
    return Buffer.from(key, 'hex');
  }

  // Hash the key to get exactly 32 bytes
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt a plaintext string with AES-256-GCM.
 * Returns: iv:encrypted:authTag (hex-encoded, colon-separated)
 * 
 * @param {string} plaintext - Text to encrypt
 * @returns {string} Encrypted string in format iv:ciphertext:authTag
 */
function encrypt(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Plaintext must be a non-empty string');
  }

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', ENCODING);
  encrypted += cipher.final(ENCODING);

  const authTag = cipher.getAuthTag().toString(ENCODING);

  // Format: iv:ciphertext:authTag
  return `${iv.toString(ENCODING)}:${encrypted}:${authTag}`;
}

/**
 * Decrypt an encrypted string.
 * Expects format: iv:ciphertext:authTag (as produced by encrypt())
 * 
 * @param {string} encryptedData - Encrypted string in format iv:ciphertext:authTag
 * @returns {string} Decrypted plaintext
 */
function decrypt(encryptedData) {
  if (!encryptedData || typeof encryptedData !== 'string') {
    throw new Error('Encrypted data must be a non-empty string');
  }

  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format. Expected iv:ciphertext:authTag');
  }

  const [ivHex, encrypted, authTagHex] = parts;
  const key = getKey();
  const iv = Buffer.from(ivHex, ENCODING);
  const authTag = Buffer.from(authTagHex, ENCODING);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, ENCODING, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = { encrypt, decrypt };
