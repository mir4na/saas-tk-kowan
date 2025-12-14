const express = require('express');
const { listPastes, getPaste, createPaste, updatePaste } = require('../controllers/pasteController');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, listPastes);
router.post('/', authenticate, createPaste);
router.get('/:slug', optionalAuth, getPaste);
router.put('/:slug', authenticate, updatePaste);

module.exports = router;
