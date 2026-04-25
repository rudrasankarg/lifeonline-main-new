const { Router } = require('express');
const { triggerSOS } = require('../controllers/sos.controller');

const router = Router();

// POST /sos
router.post('/', triggerSOS);

module.exports = router;
