const { Router } = require('express');
const { chat } = require('../controllers/chat.controller');

const router = Router();

// POST /chat
router.post('/', chat);

module.exports = router;
