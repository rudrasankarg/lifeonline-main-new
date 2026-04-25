// Chat Controller – Gemini AI health chatbot
const { chatWithGemini } = require('../services/gemini.service');

/**
 * POST /chat
 * Body: { message: string, history?: Array }
 * History format: [{ role: 'user'|'model', parts: [{ text: string }] }]
 */
async function chat(req, res, next) {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'message is required' });
    }

    const reply = await chatWithGemini(message.trim(), history || []);

    return res.json({ success: true, reply });
  } catch (err) {
    // If Gemini API key is missing/invalid, return a helpful fallback
    if (err.message?.includes('API_KEY') || err.message?.includes('401')) {
      return res.status(503).json({
        success: false,
        error: 'AI service temporarily unavailable',
        reply: 'Our AI assistant is currently unavailable. For emergencies, please press the SOS button or call 108.',
      });
    }
    next(err);
  }
}

module.exports = { chat };
