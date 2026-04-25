// Doctor Controller – doctor matching
const { matchDoctor } = require('../services/doctor.service');

/**
 * GET /doctor/match?department=cardiology
 */
async function getDoctorMatch(req, res, next) {
  try {
    const { department } = req.query;

    if (!department) {
      return res.status(400).json({ error: 'department query parameter is required' });
    }

    const doctor = await matchDoctor(department);

    if (!doctor) {
      return res.status(409).json({ error: 'No available doctor is currently online' });
    }

    return res.json({ success: true, doctor });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDoctorMatch };
