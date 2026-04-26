// Session Service – manages video call sessions
const { v4: uuidv4 } = require('uuid');
const { getFirestore } = require('../config/firebase');
const { listAvailableDoctors } = require('./doctor.service');

// In-memory session store (supplements Firestore for low-latency lookups)
const activeSessions = new Map();

const ACTIVE_STATUSES = new Set(['waiting', 'ringing', 'connecting', 'connected']);

function randomItem(list) {
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

async function doctorHasActiveSession(db, doctorId) {
  const snap = await db.collection('sessions')
    .where('doctorId', '==', doctorId)
    .get();

  return snap.docs.some((doc) => {
    const data = doc.data() || {};
    return ACTIVE_STATUSES.has(data.status);
  });
}

async function pickDoctorForSession(db, { requestedDoctorId, department }) {
  if (requestedDoctorId) {
    const requested = await db.collection('doctorPresence').doc(requestedDoctorId).get();
    if (requested.exists) {
      const data = requested.data() || {};
      if (data.available === true) {
        const busy = await doctorHasActiveSession(db, requested.id);
        if (!busy) {
          return {
            id: requested.id,
            name: data.name || data.displayName || data.email || 'Doctor',
            email: data.email || '',
            photoURL: data.photoURL || null,
          };
        }
      }
    }
  }

  const candidates = await listAvailableDoctors(department);
  if (!candidates.length) return null;

  // Shuffle candidates so assignment remains random but we can skip busy doctors.
  const pool = [...candidates].sort(() => Math.random() - 0.5);
  for (const doctor of pool) {
    const busy = await doctorHasActiveSession(db, doctor.id);
    if (!busy) return doctor;
  }

  return null;
}

/**
 * Creates a new video call session.
 * Assigns an online doctor and creates a shared Firestore signalling document.
 * @returns {Promise<Object>} Session object with channelName and token
 */
async function createSession({ doctorId, userId, department, severity, patientName, isEmergency = false }) {
  const db = getFirestore();

  const assignedDoctor = await pickDoctorForSession(db, {
    requestedDoctorId: doctorId,
    department,
  });

  if (!assignedDoctor) {
    const err = new Error('No available doctor is currently online. Please try again shortly.');
    err.status = 409;
    throw err;
  }

  const sessionId = uuidv4();
  const channelName = `lifeline-${sessionId.slice(0, 8)}`;

  const session = {
    sessionId,
    channelName,
    doctorId: assignedDoctor.id,
    doctorName: assignedDoctor.name || 'Doctor',
    doctorEmail: assignedDoctor.email || '',
    doctorPhoto: assignedDoctor.photoURL || null,
    userId: userId || `patient-${sessionId.slice(0, 6)}`,
    patientName: patientName || 'Patient',
    department: String(department || 'general').toLowerCase(),
    severity: String(severity || 'medium').toLowerCase(),
    status: 'waiting',
    isEmergency,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
  };

  // Persist to Firestore using sessionId as doc ID so both apps share the same key.
  await db.collection('sessions').doc(sessionId).set(session);

  // Also keep in memory for fast join lookups
  activeSessions.set(sessionId, session);

  return session;
}

/**
 * Retrieves an active session by ID.
 */
async function getSession(sessionId) {
  if (activeSessions.has(sessionId)) {
    return activeSessions.get(sessionId);
  }
  // Firestore fallback
  const db = getFirestore();
  const doc = await db.collection('sessions').doc(sessionId).get();
  if (!doc.exists) return null;

  const data = doc.data();
  activeSessions.set(sessionId, data);
  return data;
}

module.exports = { createSession, getSession };
