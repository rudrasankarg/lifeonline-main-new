// Session Controller – video call session management
const { createSession } = require('../services/session.service');

/**
 * POST /session/create
 * Body: { doctorId?, userId?, department?, severity?, patientName? }
 */
async function createVideoSession(req, res, next) {
  try {
    const { doctorId, userId, department, severity, patientName } = req.body;

    const session = await createSession({ doctorId, userId, department, severity, patientName });

    return res.status(201).json({
      success: true,
      session,
      joinUrl: `lifeline://video/${session.sessionId}`,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createVideoSession };
