// Finance Guard Routes
// NEW FILE — extend only. Delete to discard the entire Finance feature.
// No existing routes are modified.

const { Router } = require('express');
const { getTrustedLenders, checkLoan } = require('../controllers/finance.controller');

const router = Router();

// GET  /finance/trusted-lenders  — returns curated list of RBI-verified lenders
router.get('/trusted-lenders', getTrustedLenders);

// POST /finance/check-loan       — AI-powered loan safety analysis
router.post('/check-loan', checkLoan);

module.exports = router;
