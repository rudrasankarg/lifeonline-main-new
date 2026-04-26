// SOS Service – stores emergency events and notifies contacts
const { getFirestore } = require('../config/firebase');

/**
 * Creates an SOS emergency record in Firestore.
 * @param {Object} params
 * @param {string} params.userId
 * @param {{ latitude: number, longitude: number }} params.location
 * @param {Array}  params.emergencyContacts
 * @param {string} params.context
 * @returns {Promise<string>} Document ID of created event
 */
async function createSOSEvent({ userId, location, emergencyContacts = [], context = '' }) {
  const db = getFirestore();

  const event = {
    userId: userId || 'anonymous',
    location,
    emergencyContacts,
    context,
    isEmergency: true,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  const ref = await db.collection('sos_events').add(event);

  // Mock notification logic – in production integrate with FCM / SMS
  await notifyEmergencyContacts(emergencyContacts, location);

  return ref.id;
}

/**
 * Marks an SOS event as resolved.
 */
async function resolveSOSEvent(eventId) {
  const db = getFirestore();
  await db.collection('sos_events').doc(eventId).set({ status: 'resolved', resolvedAt: new Date().toISOString() });
}

/**
 * Mock notification – replace with real FCM / Twilio integration.
 */
async function notifyEmergencyContacts(contacts, location) {
  if (!contacts || contacts.length === 0) return;
  contacts.forEach((contact) => {
    console.log(
      `📱 [MOCK] Notifying ${contact.name || contact} at ${contact.phone || ''} – ` +
      `Location: lat=${location?.latitude}, lng=${location?.longitude}`
    );
  });
}

module.exports = { createSOSEvent, resolveSOSEvent };
