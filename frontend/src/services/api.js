// API Service – all backend calls go through here
import axios from 'axios';

// ── Backend URL ──────────────────────────────────────────────────────────────
// Set EXPO_PUBLIC_BACKEND_URL in frontend/.env — no fallback intentionally.
const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.userMessage = `Network error: could not reach backend at ${BASE_URL}. Check backend port, URL, and tunnel.`;
    }
    return Promise.reject(error);
  }
);

// ── Auth ────────────────────────────────────────────────────────────────────
export const loginUser = (data) => api.post('/auth', data);

// ── SOS ─────────────────────────────────────────────────────────────────────
export const triggerSOS = (data) => api.post('/sos', data);

// ── Chat ─────────────────────────────────────────────────────────────────────
export const sendChatMessage = (message, history = []) =>
  api.post('/chat', { message, history });

// ── Analyze ─────────────────────────────────────────────────────────────────
export const analyzeSymptoms = (symptoms) => api.post('/analyze', { symptoms });

// ── Doctor ──────────────────────────────────────────────────────────────────
export const matchDoctor = (department) =>
  api.get('/doctor/match', { params: { department } });

// ── Session ─────────────────────────────────────────────────────────────────
export const createSession = ({ doctorId, userId, department, severity, patientName }) =>
  api.post('/session/create', { doctorId, userId, department, severity, patientName });

export default api;
