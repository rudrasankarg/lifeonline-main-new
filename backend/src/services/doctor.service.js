// Doctor Service – online doctor presence + random matching
const { getFirestore } = require('../config/firebase');

const HEARTBEAT_TIMEOUT_MS = Number(process.env.DOCTOR_HEARTBEAT_TIMEOUT_MS || 120000);

function toMillis(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (value.seconds) return value.seconds * 1000;
  return 0;
}

function normaliseDoctor(doc) {
  const data = doc.data() || {};
  const specialties = Array.isArray(data.specialties)
    ? data.specialties.map((s) => String(s).toLowerCase())
    : ['general'];

  return {
    id: doc.id,
    uid: doc.id,
    name: data.name || data.displayName || data.email || 'Doctor',
    email: data.email || '',
    photoURL: data.photoURL || null,
    specialty: specialties[0] || 'general',
    specialties,
    availability: data.available === true,
    available: data.available === true,
    experience: data.experience || 'Live',
    rating: data.rating || 5,
    consultFee: data.consultFee ?? 0,
    lastSeenAt: data.lastSeenAt || null,
  };
}

function isRecentlyOnline(doctor) {
  if (!doctor.available) return false;
  const lastSeenMs = toMillis(doctor.lastSeenAt);
  if (!lastSeenMs) return false;
  return (Date.now() - lastSeenMs) <= HEARTBEAT_TIMEOUT_MS;
}

/**
 * Returns online and available doctors from Firestore doctorPresence collection.
 * Optional department is used as a soft filter; falls back to any online doctor.
 */
async function listAvailableDoctors(department) {
  const db = getFirestore();
  const wanted = String(department || 'general').toLowerCase();

  const snap = await db.collection('doctorPresence')
    .where('available', '==', true)
    .get();

  const online = snap.docs
    .map(normaliseDoctor)
    .filter(isRecentlyOnline);

  if (!online.length) return [];
  if (wanted === 'general') return online;

  const bySpecialty = online.filter((doctor) =>
    doctor.specialties.includes(wanted) || doctor.specialties.includes('general')
  );

  return bySpecialty.length ? bySpecialty : online;
}

/**
 * Picks one random online doctor.
 */
async function matchDoctor(department) {
  const doctors = await listAvailableDoctors(department);
  if (!doctors.length) return null;
  const idx = Math.floor(Math.random() * doctors.length);
  return doctors[idx];
}

module.exports = { matchDoctor, listAvailableDoctors };
