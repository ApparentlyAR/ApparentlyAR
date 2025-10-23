/**
 * Facilitator Authentication Manager
 *
 * Provides simple file-based storage for the facilitator password
 * used by the ApparentlyAR platform.
 */

const fs = require('fs');
const path = require('path');

const AUTH_FILE = path.join(__dirname, '../../facilitator-auth.json');
const DEFAULT_PASSWORD = 'secret';

/**
 * Ensure the auth file exists with a default password.
 */
function initializeAuthFile() {
  if (!fs.existsSync(AUTH_FILE)) {
    const payload = {
      password: DEFAULT_PASSWORD,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(AUTH_FILE, JSON.stringify(payload, null, 2));
  }
}

/**
 * Read the facilitator credentials from disk.
 * @returns {{ password: string, updatedAt?: string }}
 */
function readAuthFile() {
  initializeAuthFile();
  try {
    const raw = fs.readFileSync(AUTH_FILE, 'utf8');
    const data = JSON.parse(raw);
    if (!data || typeof data.password !== 'string' || data.password.length === 0) {
      return { password: DEFAULT_PASSWORD };
    }
    return data;
  } catch (error) {
    console.error('Failed to read facilitator auth file:', error);
    return { password: DEFAULT_PASSWORD };
  }
}

/**
 * Persist facilitator credentials to disk.
 * @param {{ password: string }} data
 */
function writeAuthFile(data) {
  try {
    const payload = {
      password: data.password,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(AUTH_FILE, JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error('Failed to write facilitator auth file:', error);
    throw error;
  }
}

/**
 * Get the current facilitator password.
 * @returns {string}
 */
function getFacilitatorPassword() {
  const data = readAuthFile();
  return data.password || DEFAULT_PASSWORD;
}

/**
 * Verify facilitator password.
 * @param {string} password
 * @returns {boolean}
 */
function verifyFacilitatorPassword(password) {
  if (typeof password !== 'string') {
    return false;
  }
  return password === getFacilitatorPassword();
}

/**
 * Update facilitator password.
 * @param {string} newPassword
 */
function updateFacilitatorPassword(newPassword) {
  if (typeof newPassword !== 'string' || newPassword.trim().length === 0) {
    throw new Error('Password must be a non-empty string.');
  }
  writeAuthFile({ password: newPassword });
}

module.exports = {
  DEFAULT_PASSWORD,
  getFacilitatorPassword,
  verifyFacilitatorPassword,
  updateFacilitatorPassword
};
