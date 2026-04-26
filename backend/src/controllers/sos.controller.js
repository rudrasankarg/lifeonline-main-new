// SOS Controller – handles emergency SOS events
const { createSOSEvent } = require('../services/sos.service');
const { getEmergencyFirstAid } = require('../services/gemini.service');
const { createSession } = require('../services/session.service');

/**
 * POST /sos
 * Body: { userId, location: { latitude, longitude }, emergencyContacts, context }
 */
async function triggerSOS(req, res, next) {
  try {
    const { userId, location, emergencyContacts, context = 'Medical Emergency' } = req.body;

    // Validate location
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      return res.status(400).json({ error: 'Valid location (latitude, longitude) is required' });
    }

    const eventId = await createSOSEvent({ userId, location, emergencyContacts, context });
    
    // Create an emergency session so the patient pops up in the doctor's queue
    try {
      await createSession({
        userId,
        department: 'emergency',
        severity: 'high',
        patientName: '🚨 SOS Patient',
        isEmergency: true
      });
    } catch (sessionErr) {
      console.warn('[SOS] Could not create session, no doctor online:', sessionErr.message);
    }

    // Get AI Triage / First Aid
    const firstAidInstructions = await getEmergencyFirstAid(context);

    return res.status(201).json({
      success: true,
      eventId,
      message: 'Emergency services notified. Help is on the way.',
      firstAid: firstAidInstructions,
      ambulanceNumber: '108',
      location,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { triggerSOS };
