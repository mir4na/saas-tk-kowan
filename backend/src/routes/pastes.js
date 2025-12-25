const express = require('express');
const { listPastes, getPaste, createPaste, updatePaste, verifyPastePassword, deletePaste } = require('../controllers/pasteController');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();
const MAX_CONTENT_LENGTH = 100000;

const validateContentLength = (req, res, next) => {
  const { content } = req.body;
  if (content && content.length > MAX_CONTENT_LENGTH) {
    return res.status(400).json({ message: `Content must not exceed ${MAX_CONTENT_LENGTH} characters` });
  }
  return next();
};

router.get('/', authenticate, listPastes);
router.post('/', authenticate, validateContentLength, createPaste);
router.get('/:slug', optionalAuth, getPaste);
router.post('/:slug/verify', optionalAuth, verifyPastePassword);
router.put('/:slug', authenticate, validateContentLength, updatePaste);
router.delete('/:slug', authenticate, deletePaste);

module.exports = router;
