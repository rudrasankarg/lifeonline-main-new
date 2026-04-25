// SOS Controller – handles emergency SOS events
const { createSOSEvent } = require('../services/sos.service');

/**
 * POST /sos
 * Body: { userId, location: { latitude, longitude }, emergencyContacts }
 */
async function triggerSOS(req, res, next) {
  try {
    const { userId, location, emergencyContacts } = req.body;

    // Validate location
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      return res.status(400).json({ error: 'Valid location (latitude, longitude) is required' });
    }

    const eventId = await createSOSEvent({ userId, location, emergencyContacts });

    return res.status(201).json({
      success: true,
      eventId,
      message: 'Emergency services notified. Help is on the way.',
      ambulanceNumber: '108',
      location,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { triggerSOS };
