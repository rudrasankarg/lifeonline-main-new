// Auth Controller – mock/Firebase auth endpoints
const { getFirestore } = require('../config/firebase');

/**
 * POST /auth
 * Accepts email + password (or phone) and returns a mock token.
 * In production: use Firebase Admin SDK to verify ID tokens sent from client.
 */
async function login(req, res, next) {
  try {
    const { email, phone, idToken } = req.body;

    // If Firebase ID token is provided, verify it
    if (idToken) {
      // In production: const decoded = await admin.auth().verifyIdToken(idToken);
      return res.json({
        success: true,
        userId: `firebase-uid-${Date.now()}`,
        message: 'Authenticated via Firebase',
      });
    }

    // Mock auth for development
    if (!email && !phone) {
      return res.status(400).json({ error: 'email or phone required' });
    }

    const userId = `user-${Buffer.from(email || phone).toString('base64').slice(0, 8)}`;

    return res.json({ success: true, userId, token: `mock-jwt-${userId}` });
  } catch (err) {
    next(err);
  }
}

module.exports = { login };
