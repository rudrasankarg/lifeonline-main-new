const { Router } = require('express');
const { analyze } = require('../controllers/analyze.controller');

const router = Router();

// POST /analyze
router.post('/', analyze);

module.exports = router;
