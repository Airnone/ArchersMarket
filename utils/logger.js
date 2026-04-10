// utils/logger.js
const Log = require('../models/log');

/**
 * Utility to record security events to the database.
 * * @param {String} eventType - Must match one of the enums in the Log model
 * @param {String} description - Details about the event
 * @param {Object} req - The Express request object (used to extract IP)
 * @param {String} userId - (Optional) The ID of the user involved
 */
const logEvent = async (eventType, description, req = null, userId = null) => {
  try {
    let ipAddress = 'Unknown';
    if (req) {
      // Extract IP address securely, checking for proxies
      ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    }

    const newLog = new Log({
      eventType,
      description,
      ipAddress,
      user: userId
    });

    await newLog.save();
  } catch (error) {
    // We strictly use console.error here so a logging failure doesn't crash the server
    console.error('CRITICAL: Failed to write to audit log:', error);
  }
};

module.exports = { logEvent };