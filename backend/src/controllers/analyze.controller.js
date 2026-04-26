// Analyze Controller – AI-based symptom triage
const { analyzeSymptoms } = require('../services/gemini.service');

/**
 * POST /analyze
 * Body: { symptoms: string }
 * Returns: { severity, department, action, explanation }
 */
async function analyze(req, res, next) {
  try {
    const { symptoms } = req.body;

    if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length < 3) {
      return res.status(400).json({ error: 'Please describe your symptoms in at least a few words' });
    }

    const result = await analyzeSymptoms(symptoms.trim());

    // Validate output fields
    const validSeverities = ['low', 'medium', 'high'];
    const validActions = ['chat', 'consult', 'video_call'];

    if (!validSeverities.includes(result.severity)) result.severity = 'medium';
    if (!validActions.includes(result.action)) result.action = 'consult';
    if (!result.recommended_specialty) result.recommended_specialty = 'General';
    if (typeof result.severity_score !== 'number') result.severity_score = 5;

    return res.json({ success: true, ...result });
  } catch (err) {
    if (err instanceof SyntaxError) {
      // Gemini returned malformed JSON – return a safe fallback
      return res.json({
        success: true,
        severity: 'medium',
        severity_score: 5,
        recommended_specialty: 'General',
        action: 'consult',
        explanation: 'Unable to fully analyse symptoms. Please consult a doctor.',
      });
    }
    next(err);
  }
}

module.exports = { analyze };
