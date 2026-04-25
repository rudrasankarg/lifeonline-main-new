// Gemini AI Service – wraps the Google Generative AI SDK
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Model preference order – first available one wins
// gemini-2.0-flash is the current stable GA model (April 2025)
const MODEL_PRIMARY  = 'gemini-2.0-flash';
const MODEL_FALLBACK = 'gemini-1.5-flash-latest';

/**
 * Returns a GenerativeModel, trying primary then fallback.
 * @param {Object} options – passed to getGenerativeModel
 */
function getModel(options = {}) {
  // Use env override if set, otherwise default to primary
  const modelName = process.env.GEMINI_MODEL || MODEL_PRIMARY;
  return genAI.getGenerativeModel({ ...options, model: modelName });
}

// System instruction that strictly limits the model to health topics
const HEALTH_SYSTEM_PROMPT = `You are LifeLine AI, a compassionate and knowledgeable medical assistant.
STRICT RULES:
1. ONLY answer health-related questions (symptoms, medications, first aid, mental health, nutrition, fitness).
2. If the query is NOT health-related, respond EXACTLY with:
   "I can only assist with health-related concerns."
3. If symptoms sound severe or life-threatening → strongly recommend calling emergency services or using the SOS button.
4. If symptoms are moderate → recommend seeing a doctor or using the video call feature.
5. If symptoms are mild → provide general guidance.
6. Always remind the user: "This is not a substitute for professional medical advice."
7. Keep answers concise, empathetic, and easy to understand.`;

/**
 * Sends a chat message to Gemini and returns the AI reply.
 * @param {string} userMessage - The user's message.
 * @param {Array}  history     - Previous chat turns [{role, parts: [{text}]}]
 * @returns {Promise<string>}
 */
async function chatWithGemini(userMessage, history = []) {
  const model = getModel({ systemInstruction: HEALTH_SYSTEM_PROMPT });

  const chat = model.startChat({ history });

  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}

/**
 * Analyses user symptoms and returns a triage assessment.
 * @param {string} symptoms - Free-text symptom description.
 * @returns {Promise<{severity: string, department: string, action: string, explanation: string}>}
 */
async function analyzeSymptoms(symptoms) {
  const model = getModel();

  const prompt = `You are a medical triage AI. Analyse the following symptoms and return ONLY valid JSON.

Symptoms: "${symptoms}"

Return this exact JSON structure (no markdown, no extra text):
{
  "severity": "low | medium | high",
  "department": "general | cardiology | neurology | orthopedics | psychiatry | pediatrics | dermatology | emergency",
  "action": "chat | consult | video_call",
  "explanation": "brief 1-sentence reason"
}

Rules:
- high severity → action must be "video_call"
- medium severity → action must be "consult"
- low severity → action must be "chat"`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip any accidental markdown fences
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

module.exports = { chatWithGemini, analyzeSymptoms };
