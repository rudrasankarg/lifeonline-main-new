// Firebase Admin SDK initializer
// Credentials are read from individual environment variables (Vercel-friendly).
// No JSON file needed — just paste each field from your service account JSON into the env.
const admin = require('firebase-admin');

let db = null;

/**
 * Builds a service-account credential object from individual env vars.
 * Matches the structure of a downloaded serviceAccount JSON exactly.
 */
function buildServiceAccount() {
  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
  } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    return null;
  }

  return {
    type: 'service_account',
    project_id: FIREBASE_PROJECT_ID,
    client_email: FIREBASE_CLIENT_EMAIL,
    // Vercel escapes newlines as \n literals — unescape them so the PEM is valid
    private_key: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
}

/**
 * Initialises Firebase Admin once and returns the Firestore instance.
 * Priority:
 *   1. Individual env vars: FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
 *   2. Application Default Credentials (GCP / Cloud Run)
 *   3. In-memory mock (dev fallback when nothing is configured)
 */
function getFirestore() {
  if (db) return db;

  if (admin.apps.length === 0) {
    try {
      const serviceAccount = buildServiceAccount();

      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin initialised via env vars');
      } else {
        // Fall back to Application Default Credentials (GCP / Cloud Run)
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
        console.log('Firebase Admin initialised via Application Default Credentials');
      }

      db = admin.firestore();
      console.log('Firebase Firestore connected');
    } catch (err) {
      console.warn('Firebase not configured – using in-memory mock store:', err.message);
      db = createMockDb();
    }
  } else {
    // App already initialised (e.g. hot-reload)
    try {
      db = admin.firestore();
    } catch {
      db = createMockDb();
    }
  }

  return db;
}

// ── Lightweight in-memory mock for local dev without Firebase ───────────────
function createMockDb() {
  const store = {};

  return {
    collection: (name) => ({
      add: async (data) => {
        if (!store[name]) store[name] = [];
        const id = `mock-${Date.now()}`;
        store[name].push({ id, ...data });
        return { id };
      },
      doc: (id) => ({
        set: async (data) => {
          if (!store[name]) store[name] = [];
          const idx = store[name].findIndex((d) => d.id === id);
          if (idx >= 0) store[name][idx] = { id, ...data };
          else store[name].push({ id, ...data });
        },
        get: async () => {
          const doc = (store[name] || []).find((d) => d.id === id);
          return { exists: !!doc, data: () => doc };
        },
      }),
      where: () => ({
        where: () => ({
          limit: () => ({
            get: async () => ({ empty: true, docs: [] }),
          }),
        }),
        limit: () => ({
          get: async () => ({
            empty: !(store[name] && store[name].length),
            docs: (store[name] || []).map((d) => ({ id: d.id, data: () => d })),
          }),
        }),
        get: async () => ({
          empty: !(store[name] && store[name].length),
          docs: (store[name] || []).map((d) => ({ id: d.id, data: () => d })),
        }),
      }),
      get: async () => ({
        docs: (store[name] || []).map((d) => ({ id: d.id, data: () => d })),
      }),
    }),
  };
}

module.exports = { getFirestore };
