const { Router } = require('express');
const { getDoctorMatch } = require('../controllers/doctor.controller');

const router = Router();

// GET /doctor/match?department=cardiology
router.get('/match', getDoctorMatch);

module.exports = router;
