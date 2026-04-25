const { Router } = require('express');
const { createVideoSession } = require('../controllers/session.controller');

const router = Router();

// POST /session/create
router.post('/create', createVideoSession);

module.exports = router;
