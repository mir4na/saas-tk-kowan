const express = require('express');
const { listPastes, getPaste, createPaste, updatePaste } = require('../controllers/pasteController');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, listPastes);
router.post('/', authenticate, (req, res, next) => {
    const { content } = req.body;
    
    if (content && content.length > 1024) {
      return res.status(400).json({ message: 'Content must not exceed 1024 characters' });
    }
    next();
}, createPaste);
router.get('/:slug', optionalAuth, getPaste);
router.put('/:slug', authenticate, updatePaste);

module.exports = router;
