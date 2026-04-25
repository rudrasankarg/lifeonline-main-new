// Finance Guard Controller
// NEW FILE — extend only. Delete this file + finance.routes.js to discard the feature entirely.
// No existing controller logic is modified.

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ── Curated list of RBI-regulated trusted lenders ────────────────────────────
const TRUSTED_LENDERS = [
  {
    id: 'sbi',
    name: 'SBI Personal Loan',
    type: 'PSU Bank',
    minApr: 10.3,
    maxApr: 15.9,
    maxAmount: 2000000,
    website: 'https://sbi.co.in/web/personal-banking/loans/personal-loans',
    phone: '1800-11-2211',
    tag: 'Government Bank',
    badge: 'safest',
    description: 'India\'s largest public sector bank. RBI regulated. No hidden charges.',
  },
  {
    id: 'hdfc',
    name: 'HDFC Bank Personal Loan',
    type: 'Private Bank',
    minApr: 10.85,
    maxApr: 24.0,
    maxAmount: 4000000,
    website: 'https://www.hdfcbank.com/personal/borrow/popular-loans/personal-loan',
    phone: '1800-202-6161',
    tag: 'Private Bank',
    badge: 'trusted',
    description: 'India\'s largest private bank. Instant approval, transparent terms.',
  },
  {
    id: 'pmmy',
    name: 'PM Mudra Yojana (PMMY)',
    type: 'Government Scheme',
    minApr: 9.0,
    maxApr: 12.0,
    maxAmount: 1000000,
    website: 'https://www.mudra.org.in',
    phone: '1800-180-1111',
    tag: 'Govt Scheme',
    badge: 'safest',
    description: 'Government scheme for small borrowers. Very low rates, no collateral needed.',
  },
  {
    id: 'pmjdy',
    name: 'Jan Dhan Overdraft',
    type: 'Government Scheme',
    minApr: 0,
    maxApr: 0,
    maxAmount: 10000,
    website: 'https://pmjdy.gov.in',
    phone: '1800-11-0001',
    tag: 'Zero Interest',
    badge: 'safest',
    description: 'Zero-interest overdraft up to ₹10,000 for Jan Dhan account holders.',
  },
  {
    id: 'kreditbee',
    name: 'KreditBee',
    type: 'RBI-Registered NBFC',
    minApr: 17.0,
    maxApr: 29.9,
    maxAmount: 300000,
    website: 'https://www.kreditbee.in',
    phone: null,
    tag: 'NBFC',
    badge: 'verified',
    description: 'RBI-registered NBFC. Instant personal loans. Check rates carefully before signing.',
  },
  {
    id: 'paysense',
    name: 'PaySense',
    type: 'RBI-Registered NBFC',
    minApr: 16.0,
    maxApr: 36.0,
    maxAmount: 500000,
    website: 'https://www.gopaysense.com',
    phone: null,
    tag: 'NBFC',
    badge: 'verified',
    description: 'RBI-registered digital lender. Transparent EMI, no prepayment penalty.',
  },
];

// ── Known predatory / flagged apps (common in India) ─────────────────────────
const FLAGGED_APPS = [
  'cashbean', 'loan planet', 'kredit star', 'rupee click', 'cash mama',
  'go cash', 'mobi loan', 'golden bowl', 'super cash', 'rupeelend',
  'money view lite', 'shark loan', 'instant rupee', 'easy loan', 'qloan',
  'aapka loan', 'flexi loan', 'loanfront', 'early salary', 'stashfin',
];

// ── GET /finance/trusted-lenders ─────────────────────────────────────────────
async function getTrustedLenders(req, res) {
  try {
    res.json({ lenders: TRUSTED_LENDERS });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lenders' });
  }
}

// ── POST /finance/check-loan ──────────────────────────────────────────────────
// Body: { app_name?, interest_rate?, amount?, tenure_months? }
async function checkLoan(req, res) {
  try {
    const { app_name = '', interest_rate, amount, tenure_months } = req.body;

    const appNameLower = app_name.toLowerCase();
    const isFlagged = FLAGGED_APPS.some((flag) => appNameLower.includes(flag));

    let riskLevel = 'unknown'; // safe | warning | danger | unknown
    let geminiAnalysis = '';

    // Quick local check first
    if (isFlagged) {
      riskLevel = 'danger';
    } else if (interest_rate) {
      const rate = parseFloat(interest_rate);
      if (rate < 30) riskLevel = 'safe';
      else if (rate < 60) riskLevel = 'warning';
      else riskLevel = 'danger';
    }

    // Ask Gemini for a plain-language explanation
    if (process.env.GEMINI_API_KEY) {
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });

      const prompt = `You are a financial safety advisor in India.
A patient is considering borrowing from: "${app_name || 'an unnamed lender'}"
${interest_rate ? `Interest rate claimed: ${interest_rate}% per annum` : ''}
${amount ? `Loan amount: ₹${amount}` : ''}
${tenure_months ? `Tenure: ${tenure_months} months` : ''}

In 2-3 short sentences (plain language, no jargon), tell the user:
1. Whether this seems safe, risky, or predatory
2. One specific red flag to watch for (if any)
3. What to do instead if it's risky

Return ONLY the plain text, no markdown, no bullet points.`;

      const result = await model.generateContent(prompt);
      geminiAnalysis = result.response.text().trim();
    }

    // EMI calculation (if all params provided)
    let emi = null;
    if (amount && interest_rate && tenure_months) {
      const P = parseFloat(amount);
      const r = parseFloat(interest_rate) / 12 / 100;
      const n = parseInt(tenure_months);
      emi = r === 0
        ? (P / n).toFixed(2)
        : ((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)).toFixed(2);
    }

    res.json({
      app_name,
      risk_level: riskLevel,
      is_flagged: isFlagged,
      analysis: geminiAnalysis || getDefaultAnalysis(riskLevel),
      emi,
      trusted_alternatives: riskLevel === 'danger' || riskLevel === 'warning'
        ? TRUSTED_LENDERS.filter((l) => l.badge === 'safest').slice(0, 2)
        : [],
    });
  } catch (err) {
    console.error('[FINANCE] check-loan error:', err.message);
    res.status(500).json({ error: 'Loan check failed' });
  }
}

function getDefaultAnalysis(riskLevel) {
  switch (riskLevel) {
    case 'danger':
      return 'This lender shows signs of being predatory. Avoid it. Consider SBI or PMMY instead.';
    case 'warning':
      return 'This lender has high interest rates. Read all terms carefully before proceeding.';
    case 'safe':
      return 'This lender appears to have reasonable rates. Still read all terms carefully.';
    default:
      return 'We could not verify this lender. Please check if they are RBI-registered at rbi.org.in.';
  }
}

module.exports = { getTrustedLenders, checkLoan };
