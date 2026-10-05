const { promisify } = require('node:util');
const { randomBytes, scrypt: scryptCallback, timingSafeEqual } = require('node:crypto');

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt}$${key.toString('hex')}`;
}

async function verifyPassword(password, storedPassword) {
  if (!storedPassword) return false;

  const [algorithm, salt, hash] = storedPassword.split('$');
  if (algorithm !== 'scrypt' || !salt || !hash) {
    const provided = Buffer.from(password);
    const stored = Buffer.from(storedPassword);
    return provided.length === stored.length && timingSafeEqual(provided, stored);
  }

  const storedKey = Buffer.from(hash, 'hex');
  const providedKey = await scrypt(password, salt, storedKey.length);
  return storedKey.length > 0 && timingSafeEqual(providedKey, storedKey);
}

module.exports = { hashPassword, verifyPassword };
