const crypto = require('crypto');

// Date.now() alone collides when two records are created in the same
// millisecond — a real risk under concurrent requests (e.g. two /simulate/call
// hits, or Twilio delivering overlapping calls). A short random suffix keeps
// ids human-scannable (still sorts roughly by time) while making collisions
// astronomically unlikely.
const generateId = (prefix) => `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

module.exports = {
  generateId
};
